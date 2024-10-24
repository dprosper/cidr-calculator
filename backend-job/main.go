/*
Copyright © 2022 Dimitri Prosper <dimitri.prosper@gmail.com>

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

package main

import (
	"strings"

	"dprosper/calculator/internal/logger"
	"dprosper/calculator/internal/updater"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func main() {

	logger.InitLogger(false, true, true)

	viper.SetConfigType("json")
	viper.AddConfigPath("$HOME")
	viper.AddConfigPath(".")
	viper.AddConfigPath("../local")
	viper.SetConfigName("cos")

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	err := viper.ReadInConfig()
	if err != nil {
		logger.ErrorLogger.Fatal("Data file not found in all search paths, expecting cos.json in $HOME, . or ./local.")
	}

	logger.SystemLogger.Info("Data file used",
		zap.String("name", viper.GetString("resource_instance_id")),
	)

	updater.UpdateIPRanges()

}
