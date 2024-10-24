package updater

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
	"dprosper/calculator/internal/subnetcalc"

	"github.com/Jeffail/gabs/v2"
	"go.uber.org/zap"
)

type IPS struct {
	Network    string
	DataCenter string
	Pod        string
	CidrBlocks []string
}

type ICIPRanges struct {
	Name         string                  `json:"name"`
	Type         string                  `json:"type"`
	Version      string                  `json:"version"`
	LastUpdated  string                  `json:"last_updated"`
	ReleaseNotes string                  `json:"release_notes"`
	Source       string                  `json:"source"`
	SourceJSON   string                  `json:"source_json"`
	Issues       string                  `json:"issues"`
	DataCenters  []subnetcalc.DataCenter `json:"data_centers"`
}

type TagPicker struct {
	Key       string `json:"key"`
	Name      string `json:"name"`
	City      string `json:"city"`
	GeoRegion string `json:"geo_region"`
}

type FrontEndNetwork struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type LoadBalancerIP struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

type SslVpnPop struct {
	CidrBlocks []string `json:"cidr_blocks"`
}

func removeTempFiles() {
	e := os.Remove("ips")
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "ips"))
	}
	e = os.Remove("ips-sorted.csv")
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "ips-sorted.csv"))
	}
	e = os.Remove("ips.json")
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "ips.json"))
	}
	e = os.Remove("tags.json")
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "tags.json"))
	}
	// e = os.Remove("ips.md")
	// if e != nil {
	// 	logger.SystemLogger.Debug("File not found", zap.String("file", "ips.md"))
	// }
	e = os.Remove("cos-endpoints.json")
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "cos-endpoints.json"))
	}
}

func createDataCenters() {
	f, err := os.Open("ips")
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

	output, result := runCmd("diff", []string{"ips", "ips.old"})

	// if output != "" {
	logger.SystemLogger.Info("changes found since last run.",
		zap.String("diff_output", output),
		zap.String("run_cmd_result", result),
	)

	lastRan := time.Now().Format("20060102.150405")

	// Copies ips.md to ips.<date>.md as a backup.
	ipsMd, err := os.Open("ips.md")
	if err != nil {
		logger.ErrorLogger.Fatal("error in opening file.",
			zap.String("file: ", "ips.md"),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsMd.Close()

	ipsMdCopy, err := os.Create(fmt.Sprintf("ips.%s.md", lastRan))
	if err != nil {
		logger.ErrorLogger.Fatal("error in creating file.",
			zap.String("file: ", fmt.Sprintf("ips.%s.md", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsMdCopy.Close()

	_, err = io.Copy(ipsMdCopy, ipsMd)
	if err != nil {
		logger.ErrorLogger.Fatal("error in copying file.",
			zap.String("file: ", fmt.Sprintf("ips.%s.md", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}

	// Copies ips.old to ips.<date>.old.csv as a backup.
	ipsOld, err := os.Open("ips.old")
	if err != nil {
		logger.ErrorLogger.Fatal("error in opening file.",
			zap.String("file: ", "ips.old"),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsOld.Close()

	ipsOldSave, err := os.Create(fmt.Sprintf("ips.old.%s.csv", lastRan))
	if err != nil {
		logger.ErrorLogger.Fatal("error in creating file.",
			zap.String("file: ", fmt.Sprintf("ips.old.%s.csv", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsOldSave.Close()

	_, err = io.Copy(ipsOldSave, ipsOld)
	if err != nil {
		logger.ErrorLogger.Fatal("error in copying file.",
			zap.String("file: ", fmt.Sprintf("ips.old.%s.csv", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}

	// Copies ips to ips.<date>.csv as a backup.
	ipsCSV, err := os.Open("ips")
	if err != nil {
		logger.ErrorLogger.Fatal("error in opening file.",
			zap.String("file: ", "ips"),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsCSV.Close()

	ipsNew, err := os.Create(fmt.Sprintf("ips.%s.csv", lastRan))
	if err != nil {
		logger.ErrorLogger.Fatal("error in creating file.",
			zap.String("file: ", fmt.Sprintf("ips.%s.csv", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsNew.Close()

	_, err = io.Copy(ipsNew, ipsCSV)
	if err != nil {
		logger.ErrorLogger.Fatal("error in copying file.",
			zap.String("file: ", fmt.Sprintf("ips.%s.csv", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}

	// Copies ips to ips.old
	e := os.Remove("ips.old")
	if e != nil {
		fmt.Println("ips.old file not found")
	}

	ipsCSV, err = os.Open("ips")
	if err != nil {
		logger.ErrorLogger.Fatal("error in opening file.",
			zap.String("file: ", "ips"),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsCSV.Close()

	ipsOld2, err := os.Create("ips.old")
	if err != nil {
		logger.ErrorLogger.Fatal("error in creating file.",
			zap.String("file: ", "ips.old"),
			zap.String("error: ", err.Error()),
		)
	}
	defer ipsOld2.Close()

	_, err = io.Copy(ipsOld2, ipsCSV)
	if err != nil {
		logger.ErrorLogger.Fatal("error in copying file.",
			zap.String("file: ", "ips.old"),
			zap.String("error: ", err.Error()),
		)
	}

	f, err = os.OpenFile("ips-sorted.csv", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		logger.ErrorLogger.Fatal("error opening ips-sorted.csv",
			zap.String("error: ", err.Error()),
		)
	}
	defer f.Close()

	for _, value := range ips {
		if _, err = f.WriteString(fmt.Sprintf("%s,%s,%s,%s\n", value.Network, value.DataCenter, value.Pod, strings.ReplaceAll(strings.Join(value.CidrBlocks, " "), "  ", " "))); err != nil {
			logger.ErrorLogger.Fatal("error writing ips-sorted.csv", zap.String("error: ", err.Error()))
		}
	}

	f, err = os.OpenFile(fmt.Sprintf("ips.changes.%s", lastRan), os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		logger.ErrorLogger.Fatal("error opening file",
			zap.String("file: ", fmt.Sprintf("ips.changes.%s", lastRan)),
			zap.String("error: ", err.Error()),
		)
	}
	defer f.Close()

	if _, err = f.WriteString(output); err != nil {
		logger.ErrorLogger.Fatal("error writing file",
			zap.String("error: ", err.Error()),
			zap.String("file: ", fmt.Sprintf("ips.changes.%s", lastRan)),
		)
	}

	err = exec.Command("cp", fmt.Sprintf("ips.changes.%s", lastRan), fmt.Sprintf("../data/ips.changes.%s", lastRan)).Run()
	if err != nil {
	}

	createDataCentersJSON()

	// write the ips, ips.old and ips.md
	// write output variable to a output.csv
	// } else {
	// 	logger.SystemLogger.Info("no changes found since last run.",
	// 		zap.String("diff_output", output),
	// 		zap.String("run_cmd_result", ""),
	// 	)
	// }
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
	var dataCenters []subnetcalc.DataCenter
	var frontEndNetworks []FrontEndNetwork
	var loadBalancerIPs []LoadBalancerIP
	var privateNetworks []subnetcalc.PrivateNetwork
	var serviceNetwork []subnetcalc.ServiceNetwork
	var sslVPN []subnetcalc.SslVpn
	var sslVPNPops []SslVpnPop
	var eVault []subnetcalc.Evault
	var fileBlock []subnetcalc.FileBlock
	var iCOS []subnetcalc.Icos
	var advMon []subnetcalc.AdvMon
	var rheLS []subnetcalc.RHELS
	var ims []subnetcalc.IMS
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
				ims = append(ims, subnetcalc.IMS{
					CidrBlocks: imsCidr,
				})

				if rheLS == nil {
					rheLS = append(rheLS, subnetcalc.RHELS{
						CidrBlocks: rhelsCidr,
					})
				}

				tagPicker = append(tagPicker, TagPicker{
					Key:       last,
					Name:      last,
					City:      city,
					GeoRegion: geoRegion,
				})

				cloudCidrNetworks := []subnetcalc.CidrNetwork{}
				for _, pn := range privateNetworks {
					for _, cloudCidr := range pn.CidrBlocks {

						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, service := range serviceNetwork {
					for _, cloudCidr := range service.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, sslVpn := range sslVPN {
					for _, cloudCidr := range sslVpn.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, evault := range eVault {
					for _, cloudCidr := range evault.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, icos := range iCOS {
					for _, cloudCidr := range icos.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, fileblock := range fileBlock {
					for _, cloudCidr := range fileblock.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, advmon := range advMon {
					for _, cloudCidr := range advmon.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, rhels := range rheLS {
					for _, cloudCidr := range rhels.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				for _, ims := range ims {
					for _, cloudCidr := range ims.CidrBlocks {
						cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

						cloudCidrNetwork := subnetcalc.CidrNetwork{
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
							Conflict:            false,
						}

						cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
					}
				}

				dataCenters = append(dataCenters, subnetcalc.DataCenter{
					Key:             last,
					Name:            last,
					City:            city,
					State:           state,
					Country:         country,
					GeoRegion:       geoRegion,
					PrivateNetworks: privateNetworks,
					ServiceNetwork:  serviceNetwork,
					SslVpn:          sslVPN,
					Evault:          eVault,
					Icos:            iCOS,
					FileBlock:       fileBlock,
					AdvMon:          advMon,
					RHELS:           rheLS,
					IMS:             ims,
					// FrontEndNetworks: frontEndNetworks,
					// LoadBalancerIPs:  loadBalancerIPs,
					// SslVpnPops:       sslVPNPops,
					CidrNetworks: cloudCidrNetworks,
					Conflict:     false,
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
				serviceNetwork = append(serviceNetwork, subnetcalc.ServiceNetwork{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "private_networks" {
				privateNetworks = append(privateNetworks, subnetcalc.PrivateNetwork{
					Key:        line[2],
					Name:       line[2],
					CidrBlocks: cidr,
				})
			}

			if line[0] == "service_network" {
				cidr = append(cidr, allCidr...)
				serviceNetwork = append(serviceNetwork, subnetcalc.ServiceNetwork{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "ssl_vpn" {
				sslVPN = append(sslVPN, subnetcalc.SslVpn{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "ssl_vpn_pops" {
				sslVPNPops = append(sslVPNPops, SslVpnPop{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "evault" {
				eVault = append(eVault, subnetcalc.Evault{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "file_block" {
				fileBlock = append(fileBlock, subnetcalc.FileBlock{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "icos" {
				iCOS = append(iCOS, subnetcalc.Icos{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "advmon" {
				advMon = append(advMon, subnetcalc.AdvMon{
					CidrBlocks: cidr,
				})
			}

			if line[0] == "rhe_ls" {
				cidr = getServiceNetwork(line[1])
				rheLS = append(rheLS, subnetcalc.RHELS{
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

	cloudCidrNetworks := []subnetcalc.CidrNetwork{}
	for _, pn := range privateNetworks {
		for _, cloudCidr := range pn.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, service := range serviceNetwork {
		for _, cloudCidr := range service.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, sslVpn := range sslVPN {
		for _, cloudCidr := range sslVpn.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, evault := range eVault {
		for _, cloudCidr := range evault.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, icos := range iCOS {
		for _, cloudCidr := range icos.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, fileblock := range fileBlock {
		for _, cloudCidr := range fileblock.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, advmon := range advMon {
		for _, cloudCidr := range advmon.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, rhels := range rheLS {
		for _, cloudCidr := range rhels.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	for _, ims := range ims {
		for _, cloudCidr := range ims.CidrBlocks {
			cloudDetails := subnetcalc.GetSubnetDetailsV2(cloudCidr)

			cloudCidrNetwork := subnetcalc.CidrNetwork{
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
				Conflict:            false,
			}

			cloudCidrNetworks = append(cloudCidrNetworks, cloudCidrNetwork)
		}
	}

	dataCenters = append(dataCenters, subnetcalc.DataCenter{
		Key:             last,
		Name:            last,
		City:            city,
		State:           state,
		Country:         country,
		GeoRegion:       geoRegion,
		PrivateNetworks: privateNetworks,
		ServiceNetwork:  serviceNetwork,
		SslVpn:          sslVPN,
		Evault:          eVault,
		Icos:            iCOS,
		FileBlock:       fileBlock,
		AdvMon:          advMon,
		RHELS:           rheLS,
		IMS:             ims,
		// FrontEndNetworks: frontEndNetworks,
		// LoadBalancerIPs:  loadBalancerIPs,
		// SslVpnPops:       sslVPNPops,
		CidrNetworks: cloudCidrNetworks,
		Conflict:     false,
	})

	lastUpdated := time.Now().Format("01/02/2006")

	fullObject := ICIPRanges{
		Name:         "IBM Cloud IP ranges",
		Type:         "classic_data_center_cidr",
		Version:      "3.0.2",
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

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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
	f, err := os.Open("ips")
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

func parseCPNS(content string) {
	arr := strings.Split(content, "|")

	city := strings.TrimSpace(arr[1])
	if city != "---" && strings.ToLower(city) != "city" {
		dataCenter := strings.TrimSpace(arr[2])

		pod := strings.TrimSpace(arr[3])

		ipRange := strings.TrimSpace(arr[4])

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
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

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		ips := strings.Split(strings.ReplaceAll(ipRange, "[^fn1]", ""), ` \n `)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

	city := strings.TrimSpace(arr[2])
	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])

		ipRange := strings.TrimSpace(arr[3])

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

	city := strings.TrimSpace(arr[2])

	if city != "---" && strings.ToLower(city) != "city" {

		dataCenter := strings.TrimSpace(arr[1])
		ipRange := strings.TrimSpace(arr[3])

		ips := strings.Split(ipRange, `\n`)

		f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

			f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

			f, err := os.OpenFile("ips", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600)
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

func runCmd(name string, args []string) (output string, result string) {
	out, err := exec.Command(name, args...).Output()
	result = fmt.Sprintf("%s", err)

	output = string(out[:])

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

	logger.SystemLogger.Info(fmt.Sprintf("Getting IP ranges source from %s ", requestURL))

	httpRequest, _ := http.NewRequest("GET", requestURL, nil)
	httpRequest.Header.Set("User-Agent", "cidr-calculator (dimitri.prosper@gmail.com)")
	httpRequest.Header.Set("Content-Type", "text/plain; charset=utf-8")

	httpClient := &http.Client{
		Timeout: time.Duration(30 * time.Second),
	}

	httpResponse, err := httpClient.Do(httpRequest)
	if err != nil {
		logger.ErrorLogger.Fatal(fmt.Sprintf("Error encountered while getting IP ranges: %v", err))
	}
	defer httpResponse.Body.Close()

	logger.SystemLogger.Info(fmt.Sprintf("Get IP ranges response received: %s", httpResponse.Status))

	if httpResponse.StatusCode >= 200 && httpResponse.StatusCode < 300 {
		body, _ := io.ReadAll(httpResponse.Body)
		err = os.WriteFile("ips.md", body, 0644)
		if err != nil {
			panic(err)
		}
	}

	if httpResponse.StatusCode >= 300 {
		logger.ErrorLogger.Fatal(fmt.Sprintf("Failed to get IP ranges: %s", httpResponse.Status))
	}
}

func UpdateIPRanges() {
	removeTempFiles()

	sourcemdRaw := "https://raw.githubusercontent.com/ibm-cloud-docs/cloud-infrastructure/master/ips.md"

	getIPRangesMD(sourcemdRaw)

	f, _ := os.Open("ips.md")
	defer f.Close()

	scanner := bufio.NewScanner(f)
	var ipType string
	nextService := "evault"

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

		case "{: #windows-vsi-server}":
			ipType = "win-vsi-server"

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
					parseCPNS(line)
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

	e := exec.Command("cp", "ips.json", "../data/datacenters.json").Run()
	if e != nil {
		logger.SystemLogger.Debug("File not found", zap.String("file", "ips.json"))
	}

	removeTempFiles()
}
