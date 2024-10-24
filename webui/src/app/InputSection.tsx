import * as React from 'react';
import { Input } from "@/components/Input"
import { Button } from "@/components/Button"

import { compare_cidr_networks } from 'frontend-wasm';

import { Geography } from '@/components/common';

const cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

interface IProps {
  data: Geography[],
  setData: (value: Geography[]) => void,
}

export const InputSection = ({
  data,
  setData,
}: IProps) => {

  const [cidrValue, setcidrValue] = React.useState('');
  const [cidrDisabled, setCidrDisabled] = React.useState(false);
  const [cidrMessage, setCidrMessage] = React.useState(false);

  const onChangeCidrValue = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (cidrMessage !== false) {
        setCidrMessage(false);
      }
      setcidrValue(event.target.value || '');
    },
    [cidrMessage],
  );

  const _calculateClicked = () => {
    if (cidrValue.match(cidrFormat)) {
      setCidrMessage(false);
      setCidrDisabled(true);

      let conflict = false;

      data = data.map((geo) => {
        conflict = false
        geo.data.map((dataCenter) => {
          dataCenter.cidr_networks?.map((cidr_network) => {
            const compare = compare_cidr_networks(cidrValue, cidr_network.cidr_notation)
            if (compare) {
              cidr_network.conflict = true
              dataCenter.conflict = true
              conflict = true
            }
            return (cidr_network)
          })
          return (dataCenter)
        })
        geo.conflict = conflict
        geo.calculating = true
        return (geo)
      })

      setData(JSON.parse(JSON.stringify(data)));
    } else {
      setCidrMessage(true);
    }
  }

  const _reset = () => {
    setcidrValue('');

    let conflict = false;
    data = data.map((geo) => {
      geo.data.map((dataCenter) => {
        dataCenter.cidr_networks?.map((cidr_network) => {
          cidr_network.conflict = false
          dataCenter.conflict = false
          conflict = false
          return (cidr_network)
        })
        return (dataCenter)
      })
      geo.conflict = conflict
      geo.calculating = false
      return (geo)
    })
    setData(JSON.parse(JSON.stringify(data)));
    setCidrDisabled(false);
  }

  return (
    <React.Fragment>
      <Input
        value={cidrValue}
        onChange={onChangeCidrValue}
        placeholder="e.g., 10.10.10.0/24"
        disabled={cidrDisabled}
        hasError={cidrMessage}
        id="cidr"
        name="cidr"
        className="mt-2"
      />
      <Button
        variant="primary"
        onClick={_calculateClicked}
        className="mt-4 bg-ibm-blue"
        disabled={cidrDisabled}
      >
        Primary
      </Button>
      <Button
        variant="tertiary"
        onClick={_reset}
        className="mt-4"
        disabled={!cidrDisabled}
      >
        Reset
      </Button>
      {cidrMessage ?
        <span >
          <div >
            {'Invalid CIDR. '}
            <a target="_blank" href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" rel="noreferrer">Learn more</a>
          </div>
        </span>
        : null
      }

    </React.Fragment>
  )
}