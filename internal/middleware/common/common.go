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

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestHeaders middleware
func RequestHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestUUID := uuid.New().String()
		c.Writer.Header().Set("x-dd-request-uuid", requestUUID)
		c.Writer.Header().Set("User-Agent", "calculator/server")
	}
}

func RedirectHttps() gin.HandlerFunc {
	return func(c *gin.Context) {
		scheme := c.Request.Header.Get("X-Forwarded-Proto")
		logger.SystemLogger.Info("Request header scheme:" + scheme)
		if scheme != "https" {
			logger.SystemLogger.Info("Redirecting to https")
			c.Redirect(301, "https://"+c.Request.Host+c.Request.RequestURI)
		}
	}
}
