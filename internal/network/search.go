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

package network

import (
	"context"

	"github.com/blugelabs/bluge"
	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
)

func Search(indexPath string, indexType string, networkAddress string, subnetBits int) (response []byte) {
	kwfType := bluge.NewKeywordField("_type", indexType).StoreValue().Aggregatable()
	defaultCfg := bluge.DefaultConfig(indexPath).WithVirtualField(kwfType)

	var indexResponse []byte

	indexReader, err := bluge.OpenReader(defaultCfg)
	if err != nil {
		logger.ErrorLogger.Fatal("unable to open snapshot reader", zap.String("error: ", err.Error()))
	}
	defer indexReader.Close()

	query := bluge.NewBooleanQuery().
		AddMust(bluge.NewMatchQuery(networkAddress).SetField("cidr_address")).
		AddMust(bluge.NewNumericRangeQuery(float64(subnetBits), float64(subnetBits+1)).SetField("subnet_bits"))

	request := bluge.NewTopNSearch(5, query).WithStandardAggregations()

	documentMatchIterator, err := indexReader.Search(context.Background(), request)
	if err != nil {
		logger.ErrorLogger.Fatal("error executing search", zap.String("error: ", err.Error()))
	}

	match, err := documentMatchIterator.Next()
	for err == nil && match != nil {
		err = match.VisitStoredFields(func(field string, value []byte) bool {
			if field == "_source" {
				indexResponse = value
			}
			return true
		})

		if err != nil {
			logger.ErrorLogger.Fatal("error loading stored fields", zap.String("error: ", err.Error()))
		}
		match, err = documentMatchIterator.Next()
	}

	if err != nil {
		logger.ErrorLogger.Fatal("error iterator document matches", zap.String("error: ", err.Error()))
	}
	return indexResponse
}
