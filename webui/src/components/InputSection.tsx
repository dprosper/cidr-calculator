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
import { BiReset } from 'react-icons/bi';
import axios from "axios";

import { DataCenter, CidrNetwork, _copyAndSort } from './common';

const cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

const ErrorMessage = ({ children }: { children: any }) => <span style={{ color: 'red' }}>{children}</span>;

interface IProps {
  isSortedDescending: boolean,
  requestedCidrNetwork: CidrNetwork | null | undefined,
  setRequestedCidrNetwork: (value: CidrNetwork) => void,
  setElementDisabled: (value: boolean) => void,
  setItemsValue: (value: DataCenter[]) => void,
  selectedDataCenters: string[]
}

export const InputSection = ({
  isSortedDescending,
  requestedCidrNetwork,
  setRequestedCidrNetwork,
  setItemsValue,
  setElementDisabled,
  selectedDataCenters
}: IProps) => {

  const styles = {
    width: 175,
    marginBottom: 5,
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

  const _calculateClicked = () => {
    if (cidrValue.match(cidrFormat)) {
      setItemsValue([]);
      setCidrMessage(false);
      setElementDisabled(true);
      setCidrDisabled(true);

      axios.post(`/api/subnetcalc`, {
        cidr: cidrValue,
        selected_data_centers: selectedDataCenters
      }, {
        headers: {
          'content-type': 'application/json',
        }
      })
        .then((response) => {
          const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "name", !isSortedDescending);
          setItemsValue(sortedItems);
          setRequestedCidrNetwork(response.data.requested_cidr_network);
        })
    } else {
      setCidrMessage(true);
    }
  }

  const _reset = () => {
    setcidrValue('');
    axios.post(`/api/subnetcalc`, {
      cidr: '0.0.0.0/0',
      selected_data_centers: selectedDataCenters
    }, {
      headers: {
        'content-type': 'application/json',
      }
    })
      .then((response) => {
        const sortedItems: DataCenter[] = _copyAndSort(response.data.data_centers, "name", !isSortedDescending);
        setItemsValue(sortedItems);
        setCidrDisabled(false);
        setRequestedCidrNetwork({
          conflict: false,
          service: '',
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
        setElementDisabled(false);
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
                      {cidrDisabled ? <BsCalculator /> : <BsCalculatorFill />}
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
                      {cidrDisabled ? <BiReset /> : <BiReset />}
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