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

package logger

import (
	"encoding/json"
	"log"
	"os"
	"path"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var lock = &sync.Mutex{}

// SugarLogger variable
var SugarLogger *zap.SugaredLogger

// AccessLogger variable
var AccessLogger *zap.Logger

// SystemLogger variable
var SystemLogger *zap.Logger

// ErrorLogger variable
var ErrorLogger *zap.Logger

// InitLogger function
func InitLogger(accessLog bool, systemLog bool, errorLog bool) {
	if accessLog {
		accessLogWriter := zap.CombineWriteSyncers(os.Stdout, getLogWriter("access.log"))
		accessCore := zapcore.NewCore(getFileEncoder(), accessLogWriter, zapcore.DebugLevel)
		AccessLogger = zap.New(accessCore, zap.AddCaller())
		defer AccessLogger.Sync()

		SugarLogger = AccessLogger.Sugar()
	}

	if systemLog {
		systemLogWriter := zap.CombineWriteSyncers(os.Stdout, getLogWriter("system.log"))
		systemCore := zapcore.NewCore(getFileEncoder(), systemLogWriter, zapcore.DebugLevel)
		SystemLogger = zap.New(systemCore, zap.AddCaller())
		defer SystemLogger.Sync()
	}

	if errorLog {
		errorLogWriter := zap.CombineWriteSyncers(os.Stderr, getLogWriter("error.log"))
		errorCore := zapcore.NewCore(getFileEncoder(), errorLogWriter, zapcore.DebugLevel)
		ErrorLogger = zap.New(errorCore, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))
		defer ErrorLogger.Sync()
	}
}

func getFileEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	encoderConfig.LevelKey = "level"     // default is level
	encoderConfig.MessageKey = "message" // default is msg
	encoderConfig.CallerKey = "caller"   // default is caller
	encoderConfig.TimeKey = "timestamp"  // default is timestamp
	return zapcore.NewJSONEncoder(encoderConfig)
}

func getLogWriter(filename string) zapcore.WriteSyncer {
	lumberJackLogger := &lumberjack.Logger{
		Filename:   path.Join("./logs", filename),
		MaxSize:    5,
		MaxBackups: 500,
		MaxAge:     14,
		Compress:   true,
		LocalTime:  true,
	}

	lumberJackLogger.Rotate()

	return zapcore.AddSync(lumberJackLogger)
}

// GinLogger returns a gin handler func for all HTTP access logging
func GinLogger(message string) gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()

		c.Next()

		reqHeadersBytes, err := json.Marshal(c.Request.Header)
		if err != nil {
			log.Println("Could not Marshal Req Headers")
		}

		latency := time.Since(t)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		switch {
		case statusCode >= 400 && statusCode <= 499:
			{
				AccessLogger.Warn(message,
					zap.String("remote-addr", clientIP),
					zap.String("method", method),
					zap.String("url", path),
					zap.String("proto", c.Request.Proto),
					zap.Int("status", statusCode),
					zap.String("referrer", c.Request.Referer()),
					zap.String("user-agent", c.Request.UserAgent()),
					zap.String("response-time", latency.String()),
					zap.String("error", c.Errors.String()),
					zap.String("query", query),
					zap.String("headers", string(reqHeadersBytes)),
				)
			}
		case statusCode >= 500:
			{
				AccessLogger.Error(message,
					zap.String("remote-addr", clientIP),
					zap.String("method", method),
					zap.String("url", path),
					zap.String("proto", c.Request.Proto),
					zap.Int("status", statusCode),
					zap.String("referrer", c.Request.Referer()),
					zap.String("user-agent", c.Request.UserAgent()),
					zap.String("response-time", latency.String()),
					zap.String("error", c.Errors.String()),
					zap.String("query", query),
					zap.String("headers", string(reqHeadersBytes)),
				)
			}
		default:
			AccessLogger.Info(message,
				zap.String("remote-addr", clientIP),
				zap.String("method", method),
				zap.String("url", path),
				zap.String("proto", c.Request.Proto),
				zap.Int("status", statusCode),
				zap.String("referrer", c.Request.Referer()),
				zap.String("user-agent", c.Request.UserAgent()),
				zap.String("response-time", latency.String()),
				zap.String("error", c.Errors.String()),
				zap.String("query", query),
				zap.String("headers", string(reqHeadersBytes)),
			)
		}
	}
}
