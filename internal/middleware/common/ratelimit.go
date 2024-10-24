/*
Copyright © 2021 Dimitri Prosper <dimitri.prosper@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package common

import (
	"dprosper/calculator/internal/logger"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var (
	data sync.Map
)

type rate struct {
	wait  time.Time
	limit int
}

func RateLimit() gin.HandlerFunc {
	const limit = 10
	const wait = 30

	return func(c *gin.Context) {
		r := rate{}
		ip := c.GetHeader("X-Forwarded-For") + c.FullPath()

		m, ok := data.Load(ip)
		if !ok {
			r = rate{time.Now(), limit}
		} else {
			r = m.(rate)
		}

		currentRequest := time.Now()
		lastRequest := currentRequest.Sub(r.wait).Seconds()

		if lastRequest > wait {
			r = rate{time.Now(), limit - 1}
			data.Store(ip, r)
			return
		} else {
			r.limit--
			data.Store(ip, r)
		}

		if r.limit < 0 {
			logger.SystemLogger.Warn("IP address was blocked.", zap.String("ip", ip))

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": fmt.Sprintf("You have reached our rate limit of %d requests per %d seconds interval. No soup for you!", limit, wait),
			})
		}
	}
}
