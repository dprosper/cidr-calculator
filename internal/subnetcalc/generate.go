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

package subnetcalc

import (
	"fmt"
	"time"

	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
)

func CreateNewNetworks() {
	// TODO: Read from a json file to get the cidrs...
	var cidrs []string
	cidrs = append(cidrs, "192.166.0.0/24")
	cidrs = append(cidrs, "192.167.0.0/24")

	logger.SystemLogger.Info(fmt.Sprintln("Creating networks..."))

	startTime := time.Now()

	for _, cidr := range cidrs {
		GetSubnetDetails(cidr)
	}

	logger.SystemLogger.Info(fmt.Sprintln(startTime))
	indexTime := time.Since(startTime)
	logger.SystemLogger.Info("Networks creationg finished", zap.String("time", fmt.Sprintf("Created in %s ", indexTime)))
}
