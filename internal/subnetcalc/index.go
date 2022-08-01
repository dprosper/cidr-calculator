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
	"net/netip"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
	"dprosper/calculator/internal/network"
)

type SubmittedCidr struct {
	Cidr                string   `json:"cidr" validate:"required,cidrv4"`
	SelectedDataCenters []string `json:"selected_data_centers"`
	// Filter             string   `json:"filter"`
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
	Name                 string       `mapstructure:"name" json:"name"`
	Type                 string       `mapstructure:"type" json:"type"`
	Version              string       `mapstructure:"version" json:"version"`
	LastUpdated          string       `mapstructure:"last_updated" json:"last_updated"`
	ReleaseNotes         string       `mapstructure:"release_notes" json:"release_notes"`
	Source               string       `mapstructure:"source" json:"source"`
	Issues               string       `mapstructure:"issues" json:"issues"`
	RequestedCidr        string       `mapstructure:"requested_cidr" json:"requested_cidr"`
	RequestedCidrNetwork CidrNetwork  `mapstructure:"requested_cidr_network" json:"requested_cidr_network"`
	DataCenters          []DataCenter `mapstructure:"data_centers" json:"data_centers"`
}

type DataCenter struct {
	Key             string           `mapstructure:"key" json:"key"`
	Name            string           `mapstructure:"name" json:"name"`
	City            string           `mapstructure:"city" json:"city"`
	State           string           `mapstructure:"state" json:"state"`
	Country         string           `mapstructure:"country" json:"country"`
	GeoRegion       string           `mapstructure:"geo_region" json:"geo_region"`
	PrivateNetworks []PrivateNetwork `mapstructure:"private_networks" json:"private_networks"`
	ServiceNetwork  []ServiceNetwork `mapstructure:"service_network" json:"service_network"`
	SslVpn          []SslVpn         `mapstructure:"ssl_vpn" json:"ssl_vpn"`
	Evault          []Evault         `mapstructure:"evault" json:"evault"`
	FileBlock       []FileBlock      `mapstructure:"file_block" json:"file_block"`
	Icos            []Icos           `mapstructure:"icos" json:"icos"`
	AdvMon          []AdvMon         `mapstructure:"advmon" json:"advmon"`
	RHELS           []RHELS          `mapstructure:"rhe_ls" json:"rhe_ls"`
	IMS             []IMS            `mapstructure:"ims" json:"ims"`
	CidrNetworks    []CidrNetwork    `json:"cidr_networks"`
	Conflict        bool             `json:"conflict"`
}

type PrivateNetwork struct {
	Key        string   `mapstructure:"key" json:"key"`
	Name       string   `mapstructure:"name" json:"name"`
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type ServiceNetwork struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type SslVpn struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type Evault struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type FileBlock struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type Icos struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type AdvMon struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type RHELS struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type IMS struct {
	CidrBlocks []string `mapstructure:"cidr_blocks" json:"cidr_blocks"`
}

type CidrNetwork struct {
	Service             string `json:"service"`
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

// getSubnetDetailsV2 function
func getSubnetDetailsV2(cidr string) *Address {
	cidrAddress := strings.Split(cidr, "/")[0]
	cidrBits, _ := strconv.Atoi(strings.Split(cidr, "/")[1])
	indexResponse := network.Search("networks.bluge", "network", cidrAddress, cidrBits)

	if len(indexResponse) > 0 {
		logger.SystemLogger.Info(fmt.Sprintf("Checking for cidrAddress %s in the index.", cidrAddress))

		var indexResponseAddress Address

		err := json.Unmarshal(indexResponse, &indexResponseAddress)
		if err != nil {
			logger.ErrorLogger.Fatal("error unmarshalling index response", zap.String("error: ", err.Error()))
		}
		logger.SystemLogger.Info(fmt.Sprintln(indexResponseAddress))

		return &indexResponseAddress
	} else {
		fmt.Println(cidrAddress)
		fmt.Println(cidrBits)
		sub := SubnetCalculator(cidrAddress, cidrBits)

		addressResponse := Address{
			Type:                "network",
			CidrNotation:        cidr,
			SubnetBits:          sub.GetSubnetBits(),
			SubnetMask:          sub.GetSubnetMask(),
			WildcardMask:        sub.GetWildCardMask(),
			NetworkAddress:      sub.GetNetworkPortion(),
			BroadcastAddress:    sub.GetBroadcastAddress(),
			AssignableHosts:     sub.GetAssignableHosts(),
			FirstAssignableHost: sub.GetFirstIPAddress(),
			LastAssignableHost:  sub.GetLastIPAddress(),
		}
		return &addressResponse
	}
}

type IError struct {
	Field string
	Tag   string
	Value interface{}
}

// GetDetailsV2 function
func GetDetailsV2() gin.HandlerFunc {
	return func(c *gin.Context) {
		var Validator = validator.New()
		var errors []*IError

		json := new(SubmittedCidr)
		cidr := "0.0.0.0/0"
		if err := c.ShouldBindJSON(&json); err == nil {
			errValidate := Validator.Struct(json)
			if errValidate != nil {
				for _, err := range errValidate.(validator.ValidationErrors) {
					var el IError
					el.Field = err.Field()
					el.Tag = err.Tag()
					el.Value = err.Value()
					errors = append(errors, &el)
				}

				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid json was provided in the post.", "errors": errors})
				return
			}
			cidr = json.Cidr
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid json was provided in the post."})
			return
		}

		cidrAddress := strings.Split(cidr, "/")[0]
		cidrBits, _ := strconv.Atoi(strings.Split(cidr, "/")[1])

		sub := SubnetCalculator(cidrAddress, cidrBits)

		requestedCidrNetwork := CidrNetwork{
			CidrNotation:        cidr,
			SubnetBits:          sub.GetSubnetBits(),
			SubnetMask:          sub.GetSubnetMask(),
			WildcardMask:        sub.GetWildCardMask(),
			NetworkAddress:      sub.GetNetworkPortion(),
			BroadcastAddress:    sub.GetBroadcastAddress(),
			AssignableHosts:     sub.GetAssignableHosts(),
			FirstAssignableHost: sub.GetFirstIPAddress(),
			LastAssignableHost:  sub.GetLastIPAddress(),
		}

		c.JSON(http.StatusOK, requestedCidrNetwork)
	}
}

// ReadMiddleware function
func ReadMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {
		var Validator = validator.New()
		var errors []*IError
		var selectedDataCenters []string

		json := new(SubmittedCidr)
		cidr := "0.0.0.0/0"
		// filter := ""
		if err := c.ShouldBindJSON(&json); err == nil {

			errValidate := Validator.Struct(json)
			if errValidate != nil {
				for _, err := range errValidate.(validator.ValidationErrors) {
					var el IError
					el.Field = err.Field()
					el.Tag = err.Tag()
					el.Value = err.Value()
					errors = append(errors, &el)
				}

				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid json was provided in the post.", "errors": errors})
				return
			}

			if json.Cidr == "0.0.0.0/0" {
				success := true
				selectedDataCenters = json.SelectedDataCenters
				data, err := readDataCenters(cidr, selectedDataCenters)
				if err != nil {
					success = false
					c.JSON(http.StatusOK, success)
					c.Abort()
					return
				} else {
					c.JSON(http.StatusOK, data)
					return
				}
			} else {
				cidr = json.Cidr
				selectedDataCenters = json.SelectedDataCenters
			}
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Invalid json was provided in the post."})
			return
		}

		success := true
		data, err := runSubnetCalculator(cidr, selectedDataCenters)
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

func contains(s []string, str string) bool {
	if len(s) > 0 {
		for _, v := range s {
			if v == str {
				return true
			}
		}
		return false
	}

	return true
}

func runSubnetCalculator(requestedCidr string, selectedDataCenters []string) (Config, error) {
	var tmpConfig Config
	file, _ := ioutil.ReadFile("ip-ranges.json")

	err := json.Unmarshal([]byte(file), &tmpConfig)
	dataCenters := tmpConfig.DataCenters

	// var dataCenters []DataCenter
	// err := viper.UnmarshalKey("data_centers", &dataCenters)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		return Config{}, err
	}

	dataCentersOutput := []DataCenter{}

	requestedDetails := getSubnetDetailsV2(requestedCidr)
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

	// Depreacted: filtering by Country
	// dataCentersFiltered := applyFilter(dataCenters, func(dataCenter DataCenter) bool {
	// 	return strings.Contains(strings.ToLower(dataCenter.Country), strings.ToLower(filter))
	// })

	// selectedDataCenters := []string{"ams01", "ams03"}
	dataCentersFiltered := applyFilter(dataCenters, func(dataCenter DataCenter) bool {
		return contains(selectedDataCenters, strings.ToLower(dataCenter.Name))
	})

	for _, value := range dataCentersFiltered {
		dataCenter := DataCenter{}

		mapstructure.Decode(value, &dataCenter)
		cidrConflict := false
		dataCenterConflict := false

		pnsOutput := []PrivateNetwork{}
		cloudCidrNetworks := []CidrNetwork{}
		for _, pn := range dataCenter.PrivateNetworks {
			pnsJson := PrivateNetwork{Key: pn.Key, Name: pn.Name, CidrBlocks: pn.CidrBlocks}
			pnsOutput = append(pnsOutput, pnsJson)

			for _, cloudCidr := range pn.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "Private Network",
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
		}

		serviceNetworkOutput := []ServiceNetwork{}
		for _, service := range dataCenter.ServiceNetwork {
			serviceNetworkJson := ServiceNetwork{CidrBlocks: service.CidrBlocks}
			serviceNetworkOutput = append(serviceNetworkOutput, serviceNetworkJson)

			for _, cloudCidr := range service.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "Service Network",
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
		}

		sslVpnsOutput := []SslVpn{}
		for _, sslVpn := range dataCenter.SslVpn {
			sslVpnsJson := SslVpn{CidrBlocks: sslVpn.CidrBlocks}
			sslVpnsOutput = append(sslVpnsOutput, sslVpnsJson)

			for _, cloudCidr := range sslVpn.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "SSL VPN",
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
		}

		evaultOutput := []Evault{}
		for _, evault := range dataCenter.Evault {
			evaultJson := Evault{CidrBlocks: evault.CidrBlocks}
			evaultOutput = append(evaultOutput, evaultJson)

			for _, cloudCidr := range evault.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "eVault",
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
		}

		icosOutput := []Icos{}
		for _, icos := range dataCenter.Icos {
			icosJson := Icos{CidrBlocks: icos.CidrBlocks}
			icosOutput = append(icosOutput, icosJson)

			for _, cloudCidr := range icos.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "ICOS",
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
		}

		fileblockOutput := []FileBlock{}
		for _, fileblock := range dataCenter.FileBlock {
			fileblockJson := FileBlock{CidrBlocks: fileblock.CidrBlocks}
			fileblockOutput = append(fileblockOutput, fileblockJson)

			for _, cloudCidr := range fileblock.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "File & Block",
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
		}

		advmonOutput := []AdvMon{}
		for _, advmon := range dataCenter.AdvMon {
			advmonJson := AdvMon{CidrBlocks: advmon.CidrBlocks}
			advmonOutput = append(advmonOutput, advmonJson)

			for _, cloudCidr := range advmon.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "AdvMon (Nimsoft)",
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
		}

		rhelsOutput := []RHELS{}
		for _, rhels := range dataCenter.RHELS {
			rhelsJson := RHELS{CidrBlocks: rhels.CidrBlocks}
			rhelsOutput = append(rhelsOutput, rhelsJson)

			for _, cloudCidr := range rhels.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "RHEL",
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
		}

		imsOutput := []IMS{}
		for _, ims := range dataCenter.IMS {
			imsJson := IMS{CidrBlocks: ims.CidrBlocks}
			imsOutput = append(imsOutput, imsJson)

			for _, cloudCidr := range ims.CidrBlocks {
				cloudDetails := getSubnetDetailsV2(cloudCidr)
				cidrConflict = compareCidrNetworksV2(requestedCidr, cloudCidr)

				cloudCidrNetwork := CidrNetwork{
					Service:             "IMS",
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
		}

		dataCenterJson := DataCenter{
			Key:             dataCenter.Key,
			Name:            dataCenter.Name,
			City:            dataCenter.City,
			State:           dataCenter.State,
			Country:         dataCenter.Country,
			GeoRegion:       dataCenter.GeoRegion,
			PrivateNetworks: pnsOutput,
			ServiceNetwork:  serviceNetworkOutput,
			SslVpn:          sslVpnsOutput,
			Evault:          evaultOutput,
			Icos:            icosOutput,
			FileBlock:       fileblockOutput,
			AdvMon:          advmonOutput,
			RHELS:           rhelsOutput,
			IMS:             imsOutput,
			CidrNetworks:    cloudCidrNetworks,
			Conflict:        dataCenterConflict,
		}

		dataCentersOutput = append(dataCentersOutput, dataCenterJson)
	}

	config := Config{
		Name:                 viper.GetString("name"),
		Type:                 viper.GetString("type"),
		Version:              viper.GetString("version"),
		LastUpdated:          viper.GetString("last_updated"),
		ReleaseNotes:         viper.GetString("release_notes"),
		Source:               viper.GetString("source"),
		Issues:               viper.GetString("issues"),
		RequestedCidr:        requestedCidr,
		RequestedCidrNetwork: requestedCidrNetwork,
		DataCenters:          dataCentersOutput,
	}

	return config, nil
}

func compareCidrNetworksV2(leftCidr string, rightCidr string) bool {
	leftPrefix, err := netip.ParsePrefix(leftCidr)
	if err != nil {
		panic(err)
	}

	rightPrefix, err := netip.ParsePrefix(rightCidr)
	if err != nil {
		panic(err)
	}

	return leftPrefix.Overlaps(rightPrefix)
}

func readDataCenters(requestedCidr string, selectedDataCenters []string) (Config, error) {
	var tmpConfig Config
	file, _ := ioutil.ReadFile("ip-ranges.json")

	err := json.Unmarshal([]byte(file), &tmpConfig)
	dataCenters := tmpConfig.DataCenters

	// var dataCenters []DataCenter
	// err := viper.UnmarshalKey("data_centers", &dataCenters)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
		return Config{}, err
	}

	dataCentersFiltered := applyFilter(dataCenters, func(dataCenter DataCenter) bool {
		return contains(selectedDataCenters, strings.ToLower(dataCenter.Name))
	})

	dataCentersOutput := []DataCenter{}

	for _, value := range dataCentersFiltered {
		// for _, value := range dataCenters {
		dataCenter := DataCenter{}
		mapstructure.Decode(value, &dataCenter)
		conflict := false

		pnsOutput := []PrivateNetwork{}
		for _, pn := range dataCenter.PrivateNetworks {
			pnsJson := PrivateNetwork{Key: pn.Key, Name: pn.Name, CidrBlocks: pn.CidrBlocks}
			pnsOutput = append(pnsOutput, pnsJson)
		}

		serviceNetworkOutput := []ServiceNetwork{}
		for _, service := range dataCenter.ServiceNetwork {
			serviceNetworkJson := ServiceNetwork{CidrBlocks: service.CidrBlocks}
			serviceNetworkOutput = append(serviceNetworkOutput, serviceNetworkJson)
		}

		sslVpnsOutput := []SslVpn{}
		for _, sslVpn := range dataCenter.SslVpn {
			sslVpnsJson := SslVpn{CidrBlocks: sslVpn.CidrBlocks}
			sslVpnsOutput = append(sslVpnsOutput, sslVpnsJson)
		}

		eVaultOutput := []Evault{}
		for _, eVault := range dataCenter.Evault {
			eVaultJson := Evault{CidrBlocks: eVault.CidrBlocks}
			eVaultOutput = append(eVaultOutput, eVaultJson)
		}

		fileBlockOutput := []FileBlock{}
		for _, fileBlock := range dataCenter.FileBlock {
			fileBlockJson := FileBlock{CidrBlocks: fileBlock.CidrBlocks}
			fileBlockOutput = append(fileBlockOutput, fileBlockJson)
		}

		icosOutput := []Icos{}
		for _, icos := range dataCenter.Icos {
			icosJson := Icos{CidrBlocks: icos.CidrBlocks}
			icosOutput = append(icosOutput, icosJson)
		}

		advmonOutput := []AdvMon{}
		for _, advMon := range dataCenter.AdvMon {
			advmonJson := AdvMon{CidrBlocks: advMon.CidrBlocks}
			advmonOutput = append(advmonOutput, advmonJson)
		}

		rhelsOutput := []RHELS{}
		for _, rhels := range dataCenter.RHELS {
			rhelsJson := RHELS{CidrBlocks: rhels.CidrBlocks}
			rhelsOutput = append(rhelsOutput, rhelsJson)
		}

		imsOutput := []IMS{}
		for _, ims := range dataCenter.IMS {
			imsJson := IMS{CidrBlocks: ims.CidrBlocks}
			imsOutput = append(imsOutput, imsJson)
		}

		dataCenterJson := DataCenter{
			Key:             dataCenter.Key,
			Name:            dataCenter.Name,
			City:            dataCenter.City,
			State:           dataCenter.State,
			Country:         dataCenter.Country,
			GeoRegion:       dataCenter.GeoRegion,
			PrivateNetworks: pnsOutput,
			ServiceNetwork:  serviceNetworkOutput,
			SslVpn:          sslVpnsOutput,
			Evault:          eVaultOutput,
			FileBlock:       fileBlockOutput,
			Icos:            icosOutput,
			AdvMon:          advmonOutput,
			RHELS:           rhelsOutput,
			IMS:             imsOutput,
			Conflict:        conflict,
		}
		dataCentersOutput = append(dataCentersOutput, dataCenterJson)
	}

	config := Config{
		Name:          viper.GetString("name"),
		Type:          viper.GetString("type"),
		Version:       viper.GetString("version"),
		LastUpdated:   viper.GetString("last_updated"),
		ReleaseNotes:  viper.GetString("release_notes"),
		Source:        viper.GetString("source"),
		Issues:        viper.GetString("issues"),
		RequestedCidr: requestedCidr,
		DataCenters:   dataCentersOutput,
	}

	return config, nil
}
