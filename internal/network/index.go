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
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/blugelabs/bluge"
	"go.uber.org/zap"

	"dprosper/calculator/internal/logger"
)

type Network struct {
	ID                  string  `json:"-"`
	Type                string  `jbroadcast_addressson:"type"`
	CidrNotations       string  `json:"cidr_notation"`
	SubnetBits          float64 `json:"subnet_bits"`
	SubnetMask          string  `json:"subnet_mask,omitempty"`
	WildcardMask        string  `json:"wildcard_mask"`
	NetworkAddress      string  `json:"network_address,omitempty"`
	BroadcastAddress    string  `json:"broadcast_address,omitempty"`
	AssignableHosts     float64 `json:"assignable_hosts,omitempty"`
	FirstAssignableHost string  `json:"first_assignable_host,omitempty"`
	LastAssignableHost  string  `json:"last_assignable_host"`
}

type Indexable interface {
	Identifier() bluge.Identifier
	Document([]byte) *bluge.Document
}

func Index(indexPath string, indexType string, sourcePath string) {
	kwfType := bluge.NewKeywordField("_type", indexType).StoreValue().Aggregatable()
	defaultCfg := bluge.DefaultConfig(indexPath).WithVirtualField(kwfType)

	writer, err := bluge.OpenWriter(defaultCfg)
	if err != nil {
		logger.ErrorLogger.Fatal("error opening index", zap.String("index_path", indexPath), zap.String("error: ", err.Error()))
	}

	go func() {
		err := indexData(writer, indexType, sourcePath)
		if err != nil {
			logger.ErrorLogger.Fatal("error indexing data", zap.String("index_type", indexType), zap.String("source_path", sourcePath), zap.String("error: ", err.Error()))
		}
		writer.Close()
	}()
}

func parseAndBuildDoc(indexType string, dir, filename string) (Indexable, *bluge.Document, error) {
	obj, jsonBytes, err := parseJSONPath(indexType, dir, filename)
	if err != nil {
		return nil, nil, fmt.Errorf("error parsing JSON '%s': %w", filename, err)
	}
	doc := obj.Document(jsonBytes)
	return obj, doc, nil
}

func indexData(writer *bluge.Writer, indexType string, sourcePath string) error {
	logger.SystemLogger.Debug("Indexing started.")

	startTime := time.Now()
	dirEntries, err := ioutil.ReadDir(sourcePath)
	if err != nil {
		return err
	}

	var indexedCount int
	var docs []*bluge.Document
	for _, dirEntry := range dirEntries {
		_, doc, err := parseAndBuildDoc(indexType, sourcePath, dirEntry.Name())
		if err != nil {
			return err
		}

		docs = append(docs, doc)

		if len(docs) > 1000 {
			err = indexBatch(writer, docs)
			if err != nil {
				return fmt.Errorf("error executing batch: %w", err)
			}
			indexedCount += len(docs)
			docs = docs[:0]
		}
	}

	if len(docs) > 0 {
		err = indexBatch(writer, docs)
		if err != nil {
			return fmt.Errorf("error executing batch: %w", err)
		}
		indexedCount += len(docs)
	}

	indexTime := time.Since(startTime)
	timePerDoc := float64(indexTime) / float64(indexedCount)
	logger.SystemLogger.Debug("Indexing completed.",
		zap.Int("docs_indexed", indexedCount),
		zap.Duration("index_time", indexTime),
		zap.Float64("doc_average_ms", timePerDoc/float64(time.Millisecond)),
	)

	return nil
}

func indexBatch(indexWriter *bluge.Writer, docs []*bluge.Document) error {
	batch := bluge.NewBatch()
	for _, doc := range docs {
		batch.Update(doc.ID(), doc)
	}
	return indexWriter.Batch(batch)
}

func parseJSONPath(indexType string, dir, filename string) (Indexable, []byte, error) {
	docID := filename[:(len(filename) - len(filepath.Ext(filename)))]
	jsonBytes, err := ioutil.ReadFile(filepath.Join(dir, filename))
	if err != nil {
		return nil, nil, fmt.Errorf("error reading file '%s': %v", filename, err)
	}
	return unmarshalByType(indexType, docID, jsonBytes)
}

func unmarshalByType(_type, _id string, _source []byte) (rv Indexable, src []byte, err error) {
	rv = NewNetwork(_id)
	err = json.Unmarshal(_source, rv)
	if err != nil {
		return nil, nil, err
	}
	return rv, _source, nil
}

func (b *Network) Identifier() bluge.Identifier {
	return bluge.Identifier(b.ID)
}

func NewNetwork(id string) *Network {
	return &Network{
		ID: id,
	}
}

func (b *Network) Document(jsonBytes []byte) *bluge.Document {
	cidrAddress := strings.Split(b.CidrNotations, "/")[0]
	cidrBits, _ := strconv.Atoi(strings.Split(b.CidrNotations, "/")[1])

	doc := bluge.NewDocument(b.ID).
		AddField(bluge.NewStoredOnlyField("_source", jsonBytes)).
		AddField(bluge.NewKeywordField("type", b.Type)).
		AddField(bluge.NewTextField("cidr_notation", b.CidrNotations)).
		AddField(bluge.NewTextField("cidr_address", cidrAddress)).
		AddField(bluge.NewNumericField("cidr_bits", float64(cidrBits))).
		AddField(bluge.NewNumericField("subnet_bits", float64(b.SubnetBits))).
		AddField(bluge.NewTextField("network_address", b.NetworkAddress)).
		AddField(bluge.NewCompositeFieldIncluding("_all", []string{"cidr_notation"}))

	return doc
}
