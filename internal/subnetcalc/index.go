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
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
	"github.com/tidwall/gjson"
	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
	"dprosper/calculator/internal/network"
)

type SubmittedCidr struct {
	Cidr   string `json:"cidr"`
	Filter string `json:"filter"`
}

type SubnetCalculatorResponse struct {
	Status string `json:"status"`
	Meta   struct {
		Permalink   string `json:"permalink"`
		NextAddress string `json:"next_address"`
	} `json:"meta"`
	Address Address `json:"address"`
}

type Address struct {
	Type                string `json:"type,omitempty"`
	CidrNotation        string `json:"cidr_notation"`
	SubnetBits          int    `json:"subnet_bits"`
	SubnetMask          string `json:"subnet_mask"`
	WildcardMask        string `json:"wildcard_mask"`
	NetworkAddress      string `json:"network_address"`
	BroadcastAddress    string `json:"broadcast_address"`
	AssignableHosts     int    `json:"assignable_hosts"`
	FirstAssignableHost string `json:"first_assignable_host"`
	LastAssignableHost  string `json:"last_assignable_host"`
}

type Config struct {
	Name                  string             `json:"name"`
	Type                  string             `json:"type"`
	Version               string             `json:"version"`
	LastUpdated           string             `json:"last_updated"`
	RequestedCidr         string             `json:"requested_cidr"`
	RequestedCidrNetworks CidrNetwork        `json:"requested_cidr_networks"`
	DataCenters           []DataCenterResult `json:"data_centers"`
}

type DataCenter struct {
	Key        string   `mapstructure:"key"`
	Name       string   `mapstructure:"name"`
	City       string   `mapstructure:"city"`
	State      string   `mapstructure:"state"`
	Country    string   `mapstructure:"country"`
	CidrBlocks []string `mapstructure:"cidr_blocks"`
}

type DataCenterResult struct {
	Key          string        `json:"key"`
	DataCenter   string        `json:"data_center"`
	City         string        `json:"city"`
	State        string        `json:"state"`
	Country      string        `json:"country"`
	CidrBlocks   []string      `json:"cidr_blocks"`
	CidrNetworks []CidrNetwork `json:"cidr_networks"`
	Conflict     bool          `json:"conflict"`
}

type CidrNetwork struct {
	CidrNotation        string `json:"cidr_notation"`
	SubnetBits          int    `json:"subnet_bits"`
	SubnetMask          string `json:"subnet_mask"`
	WildcardMask        string `json:"wildcard_mask"`
	NetworkAddress      string `json:"network_address"`
	BroadcastAddress    string `json:"broadcast_address"`
	AssignableHosts     int    `json:"assignable_hosts"`
	FirstAssignableHost string `json:"first_assignable_host"`
	LastAssignableHost  string `json:"last_assignable_host"`
	Conflict            bool   `json:"conflict"`
}

// GetSubnetDetails function
func GetSubnetDetails(cidr string) *Address {
	cidrAddress := strings.Split(cidr, "/")[0]
	cidrBits, _ := strconv.Atoi(strings.Split(cidr, "/")[1])
	indexResponse := network.Search("networks.bluge", "network", cidrAddress, cidrBits)

	if len(indexResponse) > 0 {
		logger.SystemLogger.Info(fmt.Sprintf("checking for cidrAddress %s in the index.", cidrAddress))

		var indexResponseAddress Address

		err := json.Unmarshal(indexResponse, &indexResponseAddress)
		if err != nil {
			logger.ErrorLogger.Fatal("error unmarshalling index response", zap.String("error: ", err.Error()))
		}
		logger.SystemLogger.Info(fmt.Sprintln(indexResponseAddress))

		return &indexResponseAddress
	} else {
		requestURL := fmt.Sprintf("https://networkcalc.com/api/ip/%s", cidr)
		logger.SystemLogger.Info(fmt.Sprintf("checking for cidrAddress %s at url %s.", cidrAddress, requestURL))

		url1, err := url.ParseRequestURI(requestURL)
		if err != nil || url1.Scheme == "" {
			logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
			return nil
		}

		// http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
		httpRequest, err := http.NewRequest("GET", requestURL, nil)
		if err != nil {
			logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		}
		httpRequest.Header.Set("Accept", "application/json")

		httpClient := &http.Client{
			Timeout: time.Duration(30 * time.Second),
		}

		httpResponse, err := httpClient.Do(httpRequest)
		if err != nil {
			logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		}
		defer httpResponse.Body.Close()

		logger.SystemLogger.Info(fmt.Sprintf("response: %s", httpResponse.Status))

		if httpResponse.StatusCode >= 200 && httpResponse.StatusCode < 300 {
			body, _ := ioutil.ReadAll(httpResponse.Body)

			address := gjson.GetBytes(body, "address")

			addressRaw := json.RawMessage(address.Raw)

			var subnetCalculatorResponse SubnetCalculatorResponse
			err := json.Unmarshal(body, &subnetCalculatorResponse)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("error unmarshaling body: %v", err))
			}
			logger.SystemLogger.Info(fmt.Sprintln(subnetCalculatorResponse))

			// var addressResponse Address
			addressResponse := Address{Type: "network"}
			err = json.Unmarshal(addressRaw, &addressResponse)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("error unmarshaling raw data: %v", err))
			}
			logger.SystemLogger.Info(fmt.Sprintln(addressResponse))

			content, err := json.Marshal(&addressResponse)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("error marshaling struct: %v", err))
			}

			err = ioutil.WriteFile(fmt.Sprintf("networks/%s.%d.json", cidrAddress, cidrBits), content, 0644)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("error writing file: %v", err))
			}

			return &addressResponse
		}

		if httpResponse.StatusCode >= 300 {
			logger.ErrorLogger.Fatal(fmt.Sprintf("Failed to get response: %s", httpResponse.Status))
			return nil
		}
	}
	return nil
}

// ReadMiddleware function
func ReadMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var json SubmittedCidr
		cidr := "0.0.0.0/0"
		filter := ""
		if err := c.ShouldBindJSON(&json); err == nil {
			if json.Cidr == "0.0.0.0/0" {
				success := true
				data, err := readDataCenters(cidr)
				if err != nil {
					success = false
					c.JSON(http.StatusOK, success)
					c.Abort()
					return
				} else {
					c.JSON(http.StatusOK, data)
					return
				}
			} else if json.Cidr == "" {
				cidr = "0.0.0.0/0"
			} else {
				cidr = json.Cidr
				filter = json.Filter
			}
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"Message": "Invalid json was provided in the post."})
			return
		}

		success := true
		data, err := runSubnetCalculator(cidr, filter)
		if err != nil {
			success = false
			c.JSON(http.StatusOK, success)
			c.Abort()
		} else {
			c.JSON(http.StatusOK, data)
		}
	}
}

func applyFilter(dataCenters []DataCenter, f filterFunc) []DataCenter {
	var filteredDataCenters []DataCenter
	for _, dataCenter := range dataCenters {
		if f(dataCenter) {
			filteredDataCenters = append(filteredDataCenters, dataCenter)
		}
	}
	return filteredDataCenters
}

type filterFunc func(dataCenter DataCenter) bool

func runSubnetCalculator(requestedCidr string, filter string) (Config, error) {
	var dataCenters []DataCenter
	err := viper.UnmarshalKey("data_centers", &dataCenters)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		return Config{}, err
	}

	dataCentersOutput := []DataCenterResult{}

	requestedDetails := GetSubnetDetails(requestedCidr)
	requestedCidrNetwork := CidrNetwork{
		CidrNotation:        requestedDetails.CidrNotation,
		SubnetBits:          requestedDetails.SubnetBits,
		SubnetMask:          requestedDetails.SubnetMask,
		WildcardMask:        requestedDetails.WildcardMask,
		NetworkAddress:      requestedDetails.NetworkAddress,
		BroadcastAddress:    requestedDetails.BroadcastAddress,
		AssignableHosts:     requestedDetails.AssignableHosts,
		FirstAssignableHost: requestedDetails.FirstAssignableHost,
		LastAssignableHost:  requestedDetails.LastAssignableHost,
	}

	dataCentersFiltered := applyFilter(dataCenters, func(dataCenter DataCenter) bool {
		return strings.Contains(strings.ToLower(dataCenter.Country), strings.ToLower(filter))
	})

	for _, value := range dataCentersFiltered {
		dataCenter := DataCenter{}

		mapstructure.Decode(value, &dataCenter)
		cidrConflict := false
		dataCenterConflict := false

		cloudCidrNetworks := []CidrNetwork{}
		for _, cloudCidr := range dataCenter.CidrBlocks {

			cloudDetails := GetSubnetDetails(cloudCidr)
			cidrConflict = compareCidrNetworks(requestedCidr, cloudCidr)

			cloudCidrNetwork := CidrNetwork{
				CidrNotation:        cloudDetails.CidrNotation,
				SubnetBits:          cloudDetails.SubnetBits,
				SubnetMask:          cloudDetails.SubnetMask,
				WildcardMask:        cloudDetails.WildcardMask,
				NetworkAddress:      cloudDetails.NetworkAddress,
				BroadcastAddress:    cloudDetails.BroadcastAddress,
				AssignableHosts:     cloudDetails.AssignableHosts,
				FirstAssignableHost: cloudDetails.FirstAssignableHost,
				LastAssignableHost:  cloudDetails.LastAssignableHost,
				Conflict:            cidrConflict,
			}

			if cidrConflict {
				dataCenterConflict = true
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}

		dataCenterJson := DataCenterResult{
			Key:          dataCenter.Key,
			DataCenter:   dataCenter.Name,
			City:         dataCenter.City,
			State:        dataCenter.State,
			Country:      dataCenter.Country,
			CidrBlocks:   dataCenter.CidrBlocks,
			CidrNetworks: cloudCidrNetworks,
			Conflict:     dataCenterConflict,
		}

		dataCentersOutput = append(dataCentersOutput, dataCenterJson)
	}

	config := Config{
		Name:                  viper.GetString("name"),
		Type:                  viper.GetString("type"),
		Version:               viper.GetString("version"),
		LastUpdated:           viper.GetString("last_updated"),
		RequestedCidr:         requestedCidr,
		RequestedCidrNetworks: requestedCidrNetwork,
		DataCenters:           dataCentersOutput,
	}

	return config, nil
}

// This function is a good candidate to implement in a data loader, i.e. https://github.com/graph-gophers/dataloader
func compareCidrNetworks(leftCidr string, rightCidr string) bool {
	conflict := false
	leftSplit := strings.Split(leftCidr, "/")
	rightSplit := strings.Split(rightCidr, "/")
	useMask := ""

	if leftSplit[1] >= rightSplit[1] {
		useMask = rightSplit[1]
	} else {
		useMask = leftSplit[1]
	}

	leftDetails := GetSubnetDetails(fmt.Sprintf("%s/%s", leftSplit[0], useMask))
	rightDetails := GetSubnetDetails(fmt.Sprintf("%s/%s", rightSplit[0], useMask))

	if leftDetails.NetworkAddress == rightDetails.NetworkAddress {
		conflict = true
	}

	return conflict
}

func readDataCenters(requestedCidr string) (Config, error) {
	var dataCenters []map[string]interface{}
	err := viper.UnmarshalKey("data_centers", &dataCenters)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		return Config{}, err
	}

	dataCentersOutput := []DataCenterResult{}

	for _, value := range dataCenters {
		dataCenter := DataCenter{}
		mapstructure.Decode(value, &dataCenter)
		conflict := false

		dataCenterJson := DataCenterResult{
			Key:        dataCenter.Key,
			DataCenter: dataCenter.Name,
			City:       dataCenter.City,
			State:      dataCenter.State,
			Country:    dataCenter.Country,
			CidrBlocks: dataCenter.CidrBlocks,
			Conflict:   conflict,
		}
		dataCentersOutput = append(dataCentersOutput, dataCenterJson)
	}

	config := Config{
		Name:          viper.GetString("name"),
		Type:          viper.GetString("type"),
		Version:       viper.GetString("version"),
		LastUpdated:   viper.GetString("last_updated"),
		RequestedCidr: requestedCidr,
		DataCenters:   dataCentersOutput,
	}

	return config, nil
}
