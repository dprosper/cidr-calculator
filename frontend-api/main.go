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
	"net/http"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"dprosper/calculator/internal/logger"
	"dprosper/calculator/internal/middleware/common"
	"dprosper/calculator/internal/subnetcalc"

	"github.com/fsnotify/fsnotify"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger(true, true, true)

	viper.SetConfigType("json")
	viper.AddConfigPath("$HOME")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./data")
	viper.SetConfigName("datacenters")

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	err := viper.ReadInConfig()
	if err != nil {
		logger.ErrorLogger.Fatal("data file not found in all search paths, expecting datacenters.json in $HOME, . or ./data.")
	}

	logger.SystemLogger.Info("data file used",
		zap.String("name", viper.GetString("name")),
		zap.String("type", viper.GetString("type")),
		zap.String("version", viper.GetString("version")),
		zap.String("last_updated", viper.GetString("last_updated")),
	)

	viper.WatchConfig()

	viper.OnConfigChange(func(e fsnotify.Event) {
		logger.SystemLogger.Info("config file changed", zap.String("location", e.Name))
	})

	// comment this next line to debug during development
	gin.SetMode(gin.ReleaseMode)

	// Set the router as the default one shipped with Gin
	router := gin.Default()

	router.Use(gzip.Gzip(gzip.DefaultCompression))

	router.Use(common.RedirectHttps())

	router.Use(common.RateLimit(), gin.Recovery())

	router.Use(common.RequestHeaders())

	router.Use(logger.GinLogger("gin-logger"))

	router.POST("/api/subnetcalc", subnetcalc.ReadMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "UP",
		})
	})

	// Serve the webui app
	router.Use(static.Serve("/", static.LocalFile("./public", true)))

	router.NoRoute(func(c *gin.Context) {
		dir, file := path.Split(c.Request.RequestURI)
		ext := filepath.Ext(file)
		if file == "" || ext == "" {
			c.File("./public/index.html")
		} else {
			c.File("./public" + path.Join(dir, file))
		}
	})

	addr := ":" + strconv.Itoa(3000)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// Create a worker to initialize and update the index every 5 minutes.
	indexIsReady := make(chan bool, 1)
	indexWorker := newWorker(300 * time.Second)
	go indexWorker.indexRun(indexIsReady)

	// Wait for the index to be initialzed by the worker before starting the HTTP server.
	<-indexIsReady

	logger.SystemLogger.Info("starting server", zap.String("start", "true"))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.ErrorLogger.Fatal("error starting server", zap.String("error: ", err.Error()))
	}
}
