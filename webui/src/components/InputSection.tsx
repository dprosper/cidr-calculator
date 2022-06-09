import * as React from 'react';
import {
  Button,
  Col,
  Input,
  InputGroup,
  Row,
  Panel,
  Whisper,
  Tooltip
} from 'rsuite';
import { BsCalculator, BsCalculatorFill } from 'react-icons/bs';
import { FiFilter } from 'react-icons/fi';
import { BiReset } from 'react-icons/bi';
import axios from "axios";

import { DataCenter, CidrNetwork, _copyAndSort } from './common';

const cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

const ErrorMessage = ({ children }: { children: any }) => <span style={{ color: 'red' }}>{children}</span>;

interface IProps {
  isSortedDescending: boolean,
  filterValue: string | undefined,
  elementDisabled: boolean,
  _allItems: DataCenter[],
  setRequestedCidrNetwork: (value: CidrNetwork) => void,
  setAllItemsValue: (value: DataCenter[]) => void,
  setFilterValue: (value: string) => void,
  setElementDisabled: (value: boolean) => void,
  setItemsValue: (value: DataCenter[]) => void
}

export const InputSection  = ({
  isSortedDescending,
  filterValue,
  elementDisabled,
  _allItems,
  setRequestedCidrNetwork,
  setAllItemsValue,
  setFilterValue,
  setItemsValue,
  setElementDisabled
}: IProps) => {

    const styles = {
      width: 175,
      marginBottom: 10
    };

    const [cidrValue, setcidrValue] = React.useState('');
    const [cidrDisabled, setCidrDisabled] = React.useState(false);
    const [cidrMessage, setCidrMessage] = React.useState(false);

    const onChangeCidrValue = React.useCallback(
      (value: string, event: any) => {
        if (cidrMessage !== false) {
          setCidrMessage(false);
        }
        setcidrValue(value || '');
      },
      [cidrMessage],
    );

    const onFilterByCountry = React.useCallback(
      (value: string, event: any) => {
        value ? setItemsValue(_allItems?.filter((i: DataCenter) => i.country.toLowerCase().indexOf(value) > -1)) : setItemsValue(_allItems);
        setFilterValue(value)
      },
      [_allItems, setItemsValue, setFilterValue],
    );

    const _calculateClicked = () => {
      if (cidrValue.match(cidrFormat)) {
        setItemsValue([]);
        setCidrMessage(false);
        setElementDisabled(true);
        setCidrDisabled(true);
        axios.post(`/api/subnetcalc`, {
          cidr: cidrValue,
          filter: filterValue
        }, {
          headers: {
            'content-type': 'application/json',
          }
        })
          .then((response) => {
            const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "data_center", !isSortedDescending);
            setItemsValue(sortedItems);
            setAllItemsValue(sortedItems);
            setRequestedCidrNetwork(response.data.requested_cidr_networks);
            setElementDisabled(false);
          })
      } else {
        setCidrMessage(true);
      }
    }

    const _reset = () => {
      setcidrValue('');
      axios.post(`/api/subnetcalc`, {
        cidr: '0.0.0.0/0'
      }, {
        headers: {
          'content-type': 'application/json',
        }
      })
        .then((response) => {
          const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "data_center", !isSortedDescending);
          // setSourceName(response.data.name);
          // setSourceVersion(response.data.version);
          // setSourceLastUpdated(response.data.last_updated);
          // setSourceReleaseNotes(response.data.release_notes);
          // setSourceUrl(response.data.source);
          // setIssuesUrl(response.data.issues);
          setItemsValue(sortedItems);
          setAllItemsValue(sortedItems);
          setCidrDisabled(false);
        });
    }

    return (
      <React.Fragment>
        <Panel bordered style={{ padding: "5px" }}>
          <Row>
            <Col xs={24} sm={24} md={24}>
              <InputGroup style={styles}>
                <Input
                  value={cidrValue}
                  onChange={onChangeCidrValue}
                  placeholder="10.10.10.0/24"
                  disabled={cidrDisabled}
                />
                {!cidrDisabled &&
                  <Whisper placement="top" controlId="control-id-hover" trigger="hover"
                    speaker={
                      <Tooltip>
                        Run calculator.
                      </Tooltip>
                    }>
                    <InputGroup.Button aria-label='run calculator' onClick={_calculateClicked}>
                      {elementDisabled ? <BsCalculator /> : <BsCalculatorFill />}
                    </InputGroup.Button>
                  </Whisper>
                }
                
                {cidrDisabled &&
                  <Whisper placement="top" controlId="control-id-hover" trigger="hover"
                    speaker={
                      <Tooltip>
                        Reset.
                      </Tooltip>
                    }>
                    <InputGroup.Button aria-label='reset' onClick={_reset}>
                      {elementDisabled ? <BiReset /> : <BiReset />}
                    </InputGroup.Button>
                  </Whisper>
                }
              </InputGroup>
              {cidrMessage ?
                <ErrorMessage>
                  {'Invalid CIDR!'}
                  <Button target="_blank" href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" appearance="link" style={{ textDecoration: "none" }}>
                    Learn more
                  </Button>
                </ErrorMessage>
                : null
              }
            </Col>

            <Col xs={24} sm={24} md={24}>
              <InputGroup style={styles}>
                <Input
                  value={filterValue}
                  onChange={onFilterByCountry}
                  placeholder="country code"
                />
                <InputGroup.Addon>
                  <FiFilter />
                </InputGroup.Addon>
              </InputGroup>
            </Col>
          </Row>
        </Panel>
        <hr />
        <span>
          <p>Use this tool to help to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in IBM Cloud.</p>
        </span>
      </React.Fragment>
    )
  }