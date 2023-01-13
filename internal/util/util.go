package util

import (
	"dprosper/calculator/internal/logger"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

// GetRemoteJSON function
func GetRemoteJSON(requestURL string, saveFile string) {
	e := os.Remove(saveFile)
	if e != nil {
		fmt.Println(saveFile + " file not found")
	}

	url1, err := url.ParseRequestURI(requestURL)
	if err != nil || url1.Scheme == "" {
		logger.ErrorLogger.Fatal(fmt.Sprintf("Error encountered while parsing the request url: %v", err))
	}

	httpRequest, _ := http.NewRequest("GET", requestURL, nil)
	httpRequest.Header.Set("User-Agent", "cidr-calculator (dimitri.prosper@gmail.com)")
	httpRequest.Header.Set("Content-Type", "text/plain; charset=utf-8")

	httpClient := &http.Client{
		Timeout: time.Duration(30 * time.Second),
	}

	httpResponse, err := httpClient.Do(httpRequest)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("Error encountered while performing http request: %v", err))
	}
	defer httpResponse.Body.Close()

	logger.SystemLogger.Info(fmt.Sprintf("response: %s", httpResponse.Status))

	if httpResponse.StatusCode >= 200 && httpResponse.StatusCode < 300 {
		body, _ := io.ReadAll(httpResponse.Body)
		err = os.WriteFile(saveFile, body, 0644)
		if err != nil {
			logger.ErrorLogger.Fatal(fmt.Sprintf("Error encountered while writting "+saveFile+" to local file system: %v", err))
		}
	}
}
