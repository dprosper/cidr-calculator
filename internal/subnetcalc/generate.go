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

package subnetcalc

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
	"time"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
)

func CreateNewNetworksV2() {
	var dataCenters []DataCenter
	err := viper.UnmarshalKey("data_centers", &dataCenters)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
	}

	output := []ServiceNetwork{}

	for _, value := range dataCenters {
		dataCenter := DataCenter{}
		mapstructure.Decode(value, &dataCenter)

		for _, pn := range dataCenter.PrivateNetworks {
			pnsJson := ServiceNetwork{CidrBlocks: pn.CidrBlocks}
			output = append(output, pnsJson)
		}

		for _, service := range dataCenter.ServiceNetwork {
			serviceNetworkJson := ServiceNetwork{CidrBlocks: service.CidrBlocks}
			output = append(output, serviceNetworkJson)
		}

		for _, sslVpn := range dataCenter.SslVpn {
			sslVpnsJson := ServiceNetwork{CidrBlocks: sslVpn.CidrBlocks}
			output = append(output, sslVpnsJson)
		}

		for _, eVault := range dataCenter.Evault {
			eVaultJson := ServiceNetwork{CidrBlocks: eVault.CidrBlocks}
			output = append(output, eVaultJson)
		}

		for _, fileBlock := range dataCenter.FileBlock {
			fileBlockJson := ServiceNetwork{CidrBlocks: fileBlock.CidrBlocks}
			output = append(output, fileBlockJson)
		}

		for _, icos := range dataCenter.Icos {
			icosJson := ServiceNetwork{CidrBlocks: icos.CidrBlocks}
			output = append(output, icosJson)
		}

		for _, advMon := range dataCenter.AdvMon {
			advmonJson := ServiceNetwork{CidrBlocks: advMon.CidrBlocks}
			output = append(output, advmonJson)
		}
	}

	logger.SystemLogger.Info(fmt.Sprintln("Creating networks..."))

	startTime := time.Now()

	for _, cidrs := range output {
		for _, cidr := range cidrs.CidrBlocks {
			logger.SystemLogger.Info(fmt.Sprintln(cidr))

			cidrAddress := strings.Split(cidr, "/")[0]
			cidrBits, _ := strconv.Atoi(strings.Split(cidr, "/")[1])

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

			logger.SystemLogger.Debug(fmt.Sprintln(addressResponse))

			content, err := json.Marshal(&addressResponse)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("Encountered an error marshaling struct: %v", err))
			}

			err = ioutil.WriteFile(fmt.Sprintf("networks/%s.%d.json", cidrAddress, cidrBits), content, 0644)
			if err != nil {
				logger.ErrorLogger.Fatal(fmt.Sprintf("Encountered an error writing file: %v", err))
			}
		}
	}

	logger.SystemLogger.Info(fmt.Sprintln(startTime))
	indexTime := time.Since(startTime)
	logger.SystemLogger.Info("Networks creationg finished", zap.String("time", fmt.Sprintf("Created in %s ", indexTime)))
}
