import * as React from 'react';
import {
  Col,
  Input,
  InputGroup,
  Row,
  Panel,
  Whisper,
  Tooltip,
  Grid,
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
  requestedCidrNetwork: CidrNetwork | null | undefined,
  setRequestedCidrNetwork: (value: CidrNetwork) => void,
  setAllItemsValue: (value: DataCenter[]) => void,
  setFilterValue: (value: string) => void,
  setElementDisabled: (value: boolean) => void,
  setItemsValue: (value: DataCenter[]) => void
}

export const InputSection = ({
  isSortedDescending,
  filterValue,
  elementDisabled,
  _allItems,
  requestedCidrNetwork,
  setRequestedCidrNetwork,
  setAllItemsValue,
  setFilterValue,
  setItemsValue,
  setElementDisabled
}: IProps) => {

  const styles = {
    width: 175,
    marginBottom: 5,
  };

  const [cidrValue, setcidrValue] = React.useState('');
  const [cidrDisabled, setCidrDisabled] = React.useState(false);
  const [cidrMessage, setCidrMessage] = React.useState(false);
  const [filterDisabled, setFilterDisabled] = React.useState(false);

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
      setFilterDisabled(!!filterValue);

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
          setRequestedCidrNetwork(response.data.requested_cidr_network);
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
        setItemsValue(sortedItems);
        setAllItemsValue(sortedItems);
        setCidrDisabled(false);
        setFilterDisabled(false)
        setRequestedCidrNetwork({
          conflict: false,
          cidr_notation: '',
          subnet_bits: 0,
          subnet_mask: '',
          wildcard_mask: '',
          network_address: '',
          broadcast_address: '',
          assignable_hosts: 0,
          first_assignable_host: '',
          last_assignable_host: '',
        });
      });
  }

  return (
    <React.Fragment>
      <Panel bordered style={{ padding: "5px" }}>
        <Grid fluid>
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
                  <div style={styles} >
                    {'Invalid CIDR. '}
                    <a target="_blank" href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" rel="noreferrer">Learn more</a>
                  </div>
                </ErrorMessage>
                : <div style={{ marginBottom: 5, minHeight: 20 }}></div>
              }

              <InputGroup style={styles}>
                <Input
                  value={filterValue}
                  onChange={onFilterByCountry}
                  placeholder="country code"
                  disabled={filterDisabled}
                />
                <InputGroup.Addon>
                  <FiFilter />
                </InputGroup.Addon>
              </InputGroup>
              <div style={{ marginBottom: 5, minHeight: 20 }}></div>
              <hr style={{ marginTop: 0 }} />
              <label>CIDR Notation:</label>
              <Input disabled value={requestedCidrNetwork?.cidr_notation} />
              <label>Subnet Mask:</label>
              <Input disabled value={requestedCidrNetwork?.subnet_mask} />
              <label>Wildcard Mask:</label>
              <Input disabled value={requestedCidrNetwork?.wildcard_mask} />
              <label>Broadcast Address:</label>
              <Input disabled value={requestedCidrNetwork?.broadcast_address} />
              <label>Network Address:</label>
              <Input disabled value={requestedCidrNetwork?.network_address} />
              <label>First Assignable Host:</label>
              <Input disabled value={requestedCidrNetwork?.first_assignable_host} />
              <label>Last Assignable Host:</label>
              <Input disabled value={requestedCidrNetwork?.last_assignable_host} />
              <label># Assignable Hosts:</label>
              <Input disabled value={requestedCidrNetwork?.assignable_hosts} />
            </Col>
          </Row>
        </Grid>
      </Panel>
    </React.Fragment>
  )
}