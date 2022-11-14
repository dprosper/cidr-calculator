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
	"bufio"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"sort"
	"strings"
	"time"

	"dprosper/calculator/internal/logger"

	"github.com/Jeffail/gabs/v2"
	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type IPS struct {
	Network    string
	DataCenter string
	Pod        string
	CidrBlocks []string
}

type ICIPRanges struct {
	Name         string       `json:"name"`
	Type         string       `json:"type"`
	Version      string       `json:"version"`
	LastUpdated  string       `json:"last_updated"`
	ReleaseNotes string       `json:"release_notes"`
	Source       string       `json:"source"`
	SourceJSON   string       `json:"source_json"`
	Issues       string       `json:"issues"`
	DataCenters  []DataCenter `json:"data_centers"`
}

type TagPicker struct {
	Key       string `json:"key"`
	Name      string `json:"name"`
	City      string `json:"city"`
	GeoRegion string `json:"geo_region"`
}

type DataCenter struct {
	Key              string            `json:"key"`
	Name             string            `json:"name"`
	City             string            `json:"city"`
	State            string            `json:"state"`
	Country          string            `json:"country"`
	GeoRegion        string            `json:"geo_region"`
	FrontEndNetworks []FrontEndNetwork `json:"front_end_public_network"`
	LoadBalancerIPs  []LoadBalancerIP  `json:"load_balancers_ips"`
	PrivateNetworks  []PrivateNetwork  `json:"private_networks"`
	ServiceNetworks  []ServiceNetwork  `json:"service_network"`
	SslVpn           []SslVpn          `json:"ssl_vpn"`
	SslVpnPops       []SslVpnPop       `json:"ssl_vpn_pops"`
	Evault           []Evault          `json:"evault"`
	FileBlock        []FileBlock       `json:"file_block"`
	Icos             []Icos            `json:"icos"`
	AdvMon           []AdvMon          `json:"advmon"`
	RHELS            []RHELS           `json:"rhe_ls"`
	IMS              []IMS             `json:"ims"`
}

type FrontEndNetwork struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type LoadBalancerIP struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type PrivateNetwork struct {
	Key        string   `json:"key"`
	Name       string   `json:"name"`
	CidrBlocks []string `json:"cidr_blocks"`
}

type ServiceNetwork struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type SslVpnPop struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type SslVpn struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type Evault struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type FileBlock struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type Icos struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type AdvMon struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type RHELS struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type IMS struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

func main() {

	logger.InitLogger(false, true, true, true)

	viper.SetConfigType("json")
	viper.AddConfigPath("$HOME")
	viper.AddConfigPath(".")
	viper.AddConfigPath("../data")
	viper.SetConfigName("datacenters")

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	err := viper.ReadInConfig()
	if err != nil {
		logger.ErrorLogger.Fatal("Data file not found in all search paths, expecting datacenters.json in $HOME, . or ./data.")
	}

	logger.SystemLogger.Info("Data file used",
		zap.String("name", viper.GetString("name")),
		zap.String("type", viper.GetString("type")),
		zap.String("version", viper.GetString("version")),
		zap.String("last_updated", viper.GetString("last_updated")),
	)

	viper.WatchConfig()

	viper.OnConfigChange(func(e fsnotify.Event) {
		logger.SystemLogger.Info("Config file changed", zap.String("location", e.Name))
	})

	e := os.Remove("ips.csv")
	if e != nil {
		fmt.Println("ips.csv file not found")
	}
	e = os.Remove("ips-sorted.csv")
	if e != nil {
		fmt.Println("ips-sorted.csv file not found")
	}
	e = os.Remove("ips.json")
	if e != nil {
		fmt.Println("ips.json file not found")
	}
	e = os.Remove("tags.json")
	if e != nil {
		fmt.Println("tags.json file not found")
	}
	e = os.Remove("ips.md")
	if e != nil {
		fmt.Println("ips.md file not found")
	}

	sourcemdRaw := "https://raw.githubusercontent.com/ibm-cloud-docs/cloud-infrastructure/master/ips.md"

	getIPRangesMD(sourcemdRaw)

	f, _ := os.Open("ips.md")
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var ipType string
	nextService := "evault"

	dc := DataCenter{}
	pns := []PrivateNetwork{}

	for i := 0; scanner.Scan(); i++ {

		line := scanner.Text()

		switch line {
		case "{: #front-end-network}":
			ipType = "front-end-network"

		case "{: #load-balancer-ips}":
			ipType = "load-balancer-ips"

		case "{: #customer-private-network-space}":
			ipType = "customer-private-network-space"

		case "{: #service-network}":
			ipType = "service-network"

		case "{: #service-by-data-center}":
			ipType = "service-by-data-center"

		case "{: #ssl-vpn-data-centers}":
			ipType = "ssl-vpn-data-centers"

		case "{: #ssl-vpn-pops}":
			ipType = "ssl-vpn-pops"

		case "{: #legacy-networks}":
			ipType = "legacy-networks"

		case "{: #red-hat-enterprise-linux-server}":
			ipType = "rhe-linux-server"

		case "{: tab-title=\"eVault\"}":
			nextService = "file_block"

		case "{: tab-title=\"File & Block\"}":
			nextService = "advmon"

		case "{: tab-title=\"AdvMon (Nimsoft)\"}":
			nextService = "icos"
		}

		if ipType != "" {
			if strings.HasPrefix(line, "|") {
				if ipType == "front-end-network" {
					parseFEN(line)
				}
				if ipType == "load-balancer-ips" {
					parseLBIPS(line)
				}
				if ipType == "customer-private-network-space" {
					parseCPNS(line, dc, pns)
				}
				if ipType == "service-network" {
					parseSN(line)
				}
				if ipType == "service-by-data-center" {
					parseSDC(line, nextService)
				}
				if ipType == "ssl-vpn-data-centers" {
					parseSSLVPN(line)
				}
				if ipType == "ssl-vpn-pops" {
					parseSSLVPNPOPS(line)
				}
				if ipType == "rhe-linux-server" {
					parseRHELS(line)
				}
			}
		}
	}

	createDataCenters()

	e = os.Remove("ips.csv")
	if e != nil {
		fmt.Println("ips.csv file not found")
	}
	e = os.Remove("ips-sorted.csv")
	if e != nil {
		fmt.Println("ips-sorted.csv file not found")
	}
	e = exec.Command("cp", "ips.json", "../data/datacenters.json").Run()
	if e != nil {
		fmt.Println("ips.json file not found")
	}
	e = os.Remove("ips.json")
	if e != nil {
		fmt.Println("ips.json file not found")
	}
	e = os.Remove("tags.json")
	if e != nil {
		fmt.Println("tags.json file not found")
	}
	e = os.Remove("ips.md")
	if e != nil {
		fmt.Println("ips.md file not found")
	}
}

func createDataCenters() {
	f, err := os.Open("ips.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	csvReader := csv.NewReader(f)
	data, err := csvReader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	var ips []IPS

	for _, line := range data {
		cidr := strings.Split(line[3], " ")

		ips = append(ips, IPS{
			Network:    line[0],
			DataCenter: line[1],
			Pod:        line[2],
			CidrBlocks: cidr,
		})

		sort.SliceStable(ips, func(i, j int) bool {
			return ips[i].DataCenter < ips[j].DataCenter
		})
	}

	// TODO: Get the old csv and compare to new csv
	// getFromCOS()
	// if err != nil {
	// 	fmt.Println("error getting from COS")
	// 	panic(err)
	// }

	output := runCmd("diff", []string{"ips.csv", "ips.old.csv"})
	fmt.Println(output)

	if output == "" {
		logger.HistoryLogger.Info("no changes found since last run.",
			zap.String("diff", output),
		)
		f, err = os.OpenFile("ips-sorted.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			logger.ErrorLogger.Fatal("error opening ips-sorted.csv", zap.String("error: ", err.Error()))
		}
		defer f.Close()

		for _, value := range ips {
			if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", value.Network, value.DataCenter, value.Pod, strings.ReplaceAll(strings.Join(value.CidrBlocks, " "), "  ", " "))); err != nil {
				logger.ErrorLogger.Fatal("error writing ips-sorted.csv", zap.String("error: ", err.Error()))
			}
		}

		createDataCentersJSON()
	} else {
		fmt.Println("save to cos")
		logger.HistoryLogger.Info("changes found since last run.",
			zap.String("diff", output),
		)

		lastRan := time.Now().Format("20060102.150405")

		ips, err := os.Open("ips.csv")
		if err != nil {
			log.Fatal(err)
		}
		defer ips.Close()

		ipsNew, err := os.Create(fmt.Sprintf("ips.%s.csv", lastRan))
		if err != nil {
			log.Fatal(err)
		}
		defer ipsNew.Close()

		bytesWritten, err := io.Copy(ipsNew, ips)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Bytes Written: %d\n", bytesWritten)

		ipsOld, err := os.Open("ips.old.csv")
		if err != nil {
			log.Fatal(err)
		}
		defer ipsOld.Close()

		ipsOldSave, err := os.Create(fmt.Sprintf("ips.old.%s.csv", lastRan))
		if err != nil {
			log.Fatal(err)
		}
		defer ipsOldSave.Close()

		bytesWritten, err = io.Copy(ipsOldSave, ipsOld)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Bytes Written: %d\n", bytesWritten)

		// addToCOS()
		// write the output somewhere (json object?)
		// persist the json somewhere in order to display in the client (configmap)
	}
}

func createDataCentersJSON() {
	f, err := os.Open("ips-sorted.csv")
	if err != nil {
		logger.ErrorLogger.Fatal("error opening ips-sorted.csv", zap.String("error: ", err.Error()))
	}
	defer f.Close()

	csvReader := csv.NewReader(f)
	data, err := csvReader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	var tagPicker []TagPicker
	var dataCenters []DataCenter
	var frontEndNetworks []FrontEndNetwork
	var loadBalancerIPs []LoadBalancerIP
	var privateNetworks []PrivateNetwork
	var serviceNetwork []ServiceNetwork
	var sslVPN []SslVpn
	var sslVPNPops []SslVpnPop
	var eVault []Evault
	var fileBlock []FileBlock
	var iCOS []Icos
	var advMon []AdvMon
	var rheLS []RHELS
	var ims []IMS
	var allCidr []string
	var rhelsCidr []string
	var imsCidr []string

	icdcs, err := os.ReadFile("ibm-cloud-data-centers.json")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	jsonParsed, err := gabs.ParseJSON(icdcs)
	if err != nil {
		panic(err)
	}

	last := "ams03"
	for _, line := range data {
		start := line[1]
		// rhe_ls,any-left,,dal09

		if line[0] == "service_network" && start == "all" {
			temp := strings.Split(line[3], " ")
			allCidr = append(allCidr, temp...)
		} else if line[0] == "rhe_ls" && start == "any-left" {
			temp := getServiceNetwork(line[3])
			rhelsCidr = append(rhelsCidr, temp...)
		} else {
			if start == last {
				last = start
			} else {
				city, _ := jsonParsed.Search(last, "city").Data().(string)
				state, _ := jsonParsed.Search(last, "state").Data().(string)
				country, _ := jsonParsed.Search(last, "country").Data().(string)
				geoRegion, _ := jsonParsed.Search(last, "geo_region").Data().(string)

				// Service Networks required for IMS: DAL10, WDC04
				temp := getServiceNetwork("dal10")
				imsCidr = append(imsCidr, temp...)
				temp = getServiceNetwork("wdc04")
				imsCidr = append(imsCidr, temp...)
				if geoRegion == "Europe" {
					// Also requires AMS01
					temp = getServiceNetwork("ams03")
					imsCidr = append(imsCidr, temp...)
				}
				ims = append(ims, IMS{
					CidrBlocks: imsCidr,
				})

				if rheLS == nil {
					rheLS = append(rheLS, RHELS{
						CidrBlocks: rhelsCidr,
					})
				}

				tagPicker = append(tagPicker, TagPicker{
					Key:       last,
					Name:      last,
					City:      city,
					GeoRegion: geoRegion,
				})

				dataCenters = append(dataCenters, DataCenter{
					Key:              last,
					Name:             last,
					City:             city,
					State:            state,
					Country:          country,
					GeoRegion:        geoRegion,
					FrontEndNetworks: frontEndNetworks,
					LoadBalancerIPs:  loadBalancerIPs,
					PrivateNetworks:  privateNetworks,
					ServiceNetworks:  serviceNetwork,
					SslVpn:           sslVPN,
					SslVpnPops:       sslVPNPops,
					Evault:           eVault,
					FileBlock:        fileBlock,
					Icos:             iCOS,
					AdvMon:           advMon,
					RHELS:            rheLS,
					IMS:              ims,
				})
				frontEndNetworks = nil
				loadBalancerIPs = nil
				privateNetworks = nil
				serviceNetwork = nil
				sslVPN = nil
				sslVPNPops = nil
				eVault = nil
				fileBlock = nil
				iCOS = nil
				advMon = nil
				rheLS = nil
				ims = nil
				imsCidr = nil

				last = start
			}

			cidr := strings.Split(strings.ReplaceAll(line[3], "  ", " "), " ")

			if line[0] == "front_end_public_network" {
				frontEndNetworks = append(frontEndNetworks, FrontEndNetwork{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "load_balancers_ips" {
				loadBalancerIPs = append(loadBalancerIPs, LoadBalancerIP{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "service_network" {
				cidr = append(cidr, allCidr...)
				serviceNetwork = append(serviceNetwork, ServiceNetwork{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "private_networks" {
				privateNetworks = append(privateNetworks, PrivateNetwork{
					Key:        line[2],
					Name:       line[2],
					CidrBlocks: cidr,
				})
			}

			if line[0] == "service_network" {
				cidr = append(cidr, allCidr...)
				serviceNetwork = append(serviceNetwork, ServiceNetwork{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "ssl_vpn" {
				sslVPN = append(sslVPN, SslVpn{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "ssl_vpn_pops" {
				sslVPNPops = append(sslVPNPops, SslVpnPop{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "evault" {
				eVault = append(eVault, Evault{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "file_block" {
				fileBlock = append(fileBlock, FileBlock{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "icos" {
				iCOS = append(iCOS, Icos{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "advmon" {
				advMon = append(advMon, AdvMon{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "rhe_ls" {
				cidr = getServiceNetwork(line[1])
				rheLS = append(rheLS, RHELS{
					CidrBlocks: cidr,
				})
			}
		}
	}

	city, _ := jsonParsed.Search(last, "city").Data().(string)
	state, _ := jsonParsed.Search(last, "state").Data().(string)
	country, _ := jsonParsed.Search(last, "country").Data().(string)
	geoRegion, _ := jsonParsed.Search(last, "geo_region").Data().(string)

	tagPicker = append(tagPicker, TagPicker{
		Key:       last,
		Name:      last,
		City:      city,
		GeoRegion: geoRegion,
	})

	dataCenters = append(dataCenters, DataCenter{
		Key:              last,
		Name:             last,
		City:             city,
		State:            state,
		Country:          country,
		GeoRegion:        geoRegion,
		FrontEndNetworks: frontEndNetworks,
		LoadBalancerIPs:  loadBalancerIPs,
		PrivateNetworks:  privateNetworks,
		ServiceNetworks:  serviceNetwork,
		SslVpn:           sslVPN,
		SslVpnPops:       sslVPNPops,
		Evault:           eVault,
		FileBlock:        fileBlock,
		Icos:             iCOS,
		AdvMon:           advMon,
		RHELS:            rheLS,
	})

	// lastUpdated := time.Now().Format("2006-01-02 15:04:05")
	lastUpdated := time.Now().Format("01/02/2006")

	fullObject := ICIPRanges{
		Name:         "IBM Cloud IP ranges",
		Type:         "classic_data_center_cidr",
		Version:      "2.0.1",
		LastUpdated:  lastUpdated,
		ReleaseNotes: "https://github.com/dprosper/cidr-calculator/blob/main/docs/history.md",
		Source:       "https://cloud.ibm.com/docs/cloud-infrastructure?topic=cloud-infrastructure-ibm-cloud-ip-ranges",
		SourceJSON:   "https://raw.githubusercontent.com/dprosper/cidr-calculator/main/data/datacenters.json",
		Issues:       "https://github.com/dprosper/cidr-calculator/issues/new/choose",
		DataCenters:  dataCenters,
	}

	jsonData, err := json.MarshalIndent(fullObject, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	f, err = os.OpenFile("ips.json", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	if _, err = f.WriteString(string(jsonData)); err != nil {
		panic(err)
	}

	jsonData, err = json.MarshalIndent(tagPicker, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	f, err = os.OpenFile("tags.json", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	if _, err = f.WriteString(string(jsonData)); err != nil {
		panic(err)
	}
}

func parseFEN(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// FIXCR
		// ips := strings.Split(ipRange, `  \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "front_end_public_network", strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseLBIPS(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// FIXCR
		// ips := strings.Split(ipRange, `  \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "load_balancers_ips", strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func getServiceNetwork(dataCenter string) (cidr []string) {
	f, err := os.Open("ips.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	csvReader := csv.NewReader(f)
	data, err := csvReader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	for _, line := range data {
		if line[0] == "service_network" && line[1] == dataCenter {
			return strings.Split(line[3], " ")
		}
	}

	return
}

func parseCPNS(content string, dc DataCenter, pns []PrivateNetwork) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	city := strings.TrimSpace(arr[1])
	if city != "---" && strings.ToLower(city) != "city" {
		dataCenter := strings.TrimSpace(arr[2])

		pod := strings.TrimSpace(arr[3])

		ipRange := strings.TrimSpace(arr[4])

		// Empty space
		// fmt.Println(arr[5])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// FIXCR
		// ips := strings.Split(ipRange, `  \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "private_networks", strings.ToLower(dataCenter), strings.ToLower(pod), strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseSN(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// in addtion removing a special character that is sometimes added in the .md
		// FIXCR
		ips := strings.Split(strings.ReplaceAll(ipRange, "[^fn1]", ""), ` \n `)
		// ips = delete_empty(ips)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "service_network", strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseSDC(content string, nextService string) {
	arr := strings.Split(content, "|")

	dataCenter := strings.TrimSpace(arr[1])
	if dataCenter != "-----" && strings.ToLower(dataCenter) != "data center" && !strings.Contains(dataCenter, "**Required Flows**") {

		ipRange := strings.TrimSpace(arr[2])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// FIXCR
		// ips := strings.Split(ipRange, ` \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", nextService, strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseSSLVPN(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// FIXCR
		// ips := strings.Split(ipRange, `  \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "ssl_vpn", strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseSSLVPNPOPS(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])
	// fmt.Println(arr[1])
	// fmt.Println(arr[2])
	// fmt.Println(arr[3])

	city := strings.TrimSpace(arr[2])
	// fmt.Println(city)

	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		// fmt.Println("city")
		// fmt.Println(city)
		// fmt.Println("dataCenter")
		// fmt.Println(dataCenter)

		ipRange := strings.TrimSpace(arr[3])

		// Empty space
		// fmt.Println(arr[4])

		// typically it should be this: strings.Split(arr[4], "\n") for a true new line character.
		// ips := strings.Split(ipRange, `\n`)
		// FIXCR
		// ips := strings.Split(ipRange, `  \n `)
		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
		if err != nil {
			panic(err)
		}
		defer f.Close()

		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "ssl_vpn_pops", strings.ToLower(dataCenter), "", strings.Join(strings.Fields(strings.Join(ips, " ")), " "))); err != nil {
			panic(err)
		}
	}
}

func parseRHELS(content string) {
	arr := strings.Split(content, "|")
	// Empty space
	// fmt.Println(arr[0])

	location := strings.TrimSpace(arr[1])
	if location != "---" && strings.ToLower(location) != "server location" {
		/*
			- Loop through this list in the parentheses and extract the dataCenter
			|Amsterdam (ams01, ams03)|fra02|
			- Read the second column which is a dataCenter name and search for its servicenetwork and add to the csv file.
			- add a RHEL tab/section to the UI
		*/

		if strings.ToLower(location) == "any data center not listed" {
			dataCenter := "any-left"
			serviceDataCenter := strings.TrimSpace(arr[2])

			f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
			if err != nil {
				panic(err)
			}
			defer f.Close()

			if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "rhe_ls", strings.ToLower(strings.TrimSpace(dataCenter)), "", strings.ToLower(serviceDataCenter))); err != nil {
				panic(err)
			}

		} else {
			dcs := strings.Split(GetStringInBetweenTwoString(location, "(", ")"), ",")

			serviceDataCenter := strings.TrimSpace(arr[2])

			// Empty space
			// fmt.Println(arr[3])

			f, err := os.OpenFile("ips.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
			if err != nil {
				panic(err)
			}
			defer f.Close()

			for _, dataCenter := range dcs {
				if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", "rhe_ls", strings.ToLower(strings.TrimSpace(dataCenter)), "", strings.ToLower(serviceDataCenter))); err != nil {
					panic(err)
				}
			}
		}

	}
}

func runCmd(name string, args []string) (output string) {
	out, err := exec.Command(name, args...).Output()
	if err != nil {
		fmt.Printf("%s", err)
	}
	fmt.Println("Command Successfully Executed")
	output = string(out[:])
	fmt.Println(output)

	return
}

func GetStringInBetweenTwoString(str string, startS string, endS string) (result string) {
	s := strings.Index(str, startS)
	if s == -1 {
		return result
	}
	newS := str[s+len(startS):]
	e := strings.Index(newS, endS)
	if e == -1 {
		return result
	}
	result = newS[:e]
	return result
}

// getIPRangesMD function
func getIPRangesMD(requestURL string) {
	url1, err := url.ParseRequestURI(requestURL)
	if err != nil || url1.Scheme == "" {
		logger.ErrorLogger.Fatal(fmt.Sprintf("found an error: %v", err))
	}

	logger.SystemLogger.Info(fmt.Sprintf("checking for subnet %s ", requestURL))

	httpRequest, _ := http.NewRequest("GET", requestURL, nil)
	httpRequest.Header.Set("User-Agent", "cidr-calculator (dimitri.prosper@gmail.com)")
	httpRequest.Header.Set("Content-Type", "text/plain; charset=utf-8")

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
		body, _ := io.ReadAll(httpResponse.Body)
		err = os.WriteFile("ips.md", body, 0644)
		if err != nil {
			panic(err)
		}
	}

	if httpResponse.StatusCode >= 300 {
		logger.ErrorLogger.Fatal(fmt.Sprintf("Failed to get response: %s", httpResponse.Status))
	}
}
