// Modified extract from https://github.com/brotherpowers/ipsubnet

package subnetcalc

import (
	"fmt"
	"strconv"
	"strings"
)

type Ip struct {
	ip          string
	subnetBits  int
	subnet_mask int
}

func SubnetCalculator(ip string, subnetBits int) *Ip {
	s := &Ip{
		ip:          ip,
		subnetBits:  subnetBits,
		subnet_mask: 0xFFFFFFFF << uint(32-subnetBits),
	}

	return s
}

func (s *Ip) GetSubnetBits() int {
	return s.subnetBits
}

func (s *Ip) GetSubnetMask() string {
	return s.subnetCalculation("%d", ".")
}

func (s *Ip) subnetCalculation(format, separator string) string {
	maskQuads := []string{}
	maskQuads = append(maskQuads, fmt.Sprintf(format, (s.subnet_mask>>24)&0xFF))
	maskQuads = append(maskQuads, fmt.Sprintf(format, (s.subnet_mask>>16)&0xFF))
	maskQuads = append(maskQuads, fmt.Sprintf(format, (s.subnet_mask>>8)&0xFF))
	maskQuads = append(maskQuads, fmt.Sprintf(format, (s.subnet_mask>>0)&0xFF))

	return strings.Join(maskQuads, separator)
}

func (s *Ip) GetWildCardMask() string {
	return s.wildcardCalculation("%d", ".")
}

func (s *Ip) wildcardCalculation(format, separator string) string {
	maskQuads := []string{}
	maskQuads = append(maskQuads, fmt.Sprintf(format, 255-((s.subnet_mask>>24)&0xFF)))
	maskQuads = append(maskQuads, fmt.Sprintf(format, 255-((s.subnet_mask>>16)&0xFF)))
	maskQuads = append(maskQuads, fmt.Sprintf(format, 255-((s.subnet_mask>>8)&0xFF)))
	maskQuads = append(maskQuads, fmt.Sprintf(format, 255-((s.subnet_mask>>0)&0xFF)))

	return strings.Join(maskQuads, separator)
}

func (s *Ip) GetNetworkPortion() string {
	return s.networkCalculation("%d", ".")
}

func (s *Ip) networkCalculation(format, separator string) string {
	splits := s.GetIPAddressQuads()
	networkQuads := []string{}
	networkQuads = append(networkQuads, fmt.Sprintf(format, splits[0]&(s.subnet_mask>>24)))
	networkQuads = append(networkQuads, fmt.Sprintf(format, splits[1]&(s.subnet_mask>>16)))
	networkQuads = append(networkQuads, fmt.Sprintf(format, splits[2]&(s.subnet_mask>>8)))
	networkQuads = append(networkQuads, fmt.Sprintf(format, splits[3]&(s.subnet_mask>>0)))

	return strings.Join(networkQuads, separator)
}

func (s *Ip) GetBroadcastAddress() string {
	networkQuads := s.GetNetworkPortionQuads()
	numberIPAddress := s.GetNumberIPAddresses()
	networkRangeQuads := []string{}
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[0]&(s.subnet_mask>>24))+(((numberIPAddress-1)>>24)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[1]&(s.subnet_mask>>16))+(((numberIPAddress-1)>>16)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[2]&(s.subnet_mask>>8))+(((numberIPAddress-1)>>8)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[3]&(s.subnet_mask>>0))+(((numberIPAddress-1)>>0)&0xFF)))

	return strings.Join(networkRangeQuads, ".")
}

func (s *Ip) GetAssignableHosts() int {
	if s.subnetBits == 32 {
		return 1
	} else if s.subnetBits == 31 {
		return 2
	}
	return (s.GetNumberIPAddresses() - 2)
}

func (s *Ip) GetNumberIPAddresses() int {
	return 2 << uint(31-s.subnetBits)
}

func (s *Ip) GetFirstIPAddress() string {
	splits := s.GetIPAddressQuads()
	networkQuads := []string{}
	networkQuads = append(networkQuads, fmt.Sprintf("%d", splits[0]&(s.subnet_mask>>24)))
	networkQuads = append(networkQuads, fmt.Sprintf("%d", splits[1]&(s.subnet_mask>>16)))
	networkQuads = append(networkQuads, fmt.Sprintf("%d", splits[2]&(s.subnet_mask>>8)))
	networkQuads = append(networkQuads, fmt.Sprintf("%d", splits[3]&(s.subnet_mask>>0)+1))

	return strings.Join(networkQuads, ".")
}

func (s *Ip) GetLastIPAddress() string {
	networkQuads := s.GetNetworkPortionQuads()
	numberIPAddress := s.GetNumberIPAddresses()
	networkRangeQuads := []string{}
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[0]&(s.subnet_mask>>24))+(((numberIPAddress-1)>>24)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[1]&(s.subnet_mask>>16))+(((numberIPAddress-1)>>16)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[2]&(s.subnet_mask>>8))+(((numberIPAddress-1)>>8)&0xFF)))
	networkRangeQuads = append(networkRangeQuads, fmt.Sprintf("%d", (networkQuads[3]&(s.subnet_mask>>0))+(((numberIPAddress-1)>>0)&0xFF)-1))

	return strings.Join(networkRangeQuads, ".")
}

func convertQuadsToInt(splits []string) []int {
	quadsInt := []int{}

	for _, quard := range splits {
		j, err := strconv.Atoi(quard)
		if err != nil {
			panic(err)
		}
		quadsInt = append(quadsInt, j)
	}

	return quadsInt
}

func (s *Ip) GetNetworkPortionQuads() []int {
	return convertQuadsToInt(strings.Split(s.networkCalculation("%d", "."), "."))
}

func (s *Ip) GetIPAddressQuads() []int {
	splits := strings.Split(s.ip, ".")

	return convertQuadsToInt(splits)
}
