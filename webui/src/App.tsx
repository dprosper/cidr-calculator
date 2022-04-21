import React from 'react';
import { Stack, Text, Link, FontWeights, IStackTokens, IStackStyles, ITextStyles, ILinkStyles, DefaultPalette, IIconProps, IStackItemStyles, Pivot, PivotItem } from '@fluentui/react';
import './App.css';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { Separator } from '@fluentui/react/lib/Separator';
import { TextField, ITextFieldStyles } from '@fluentui/react/lib/TextField';
import { PrimaryButton, ActionButton } from '@fluentui/react/lib/Button';
import axios from "axios";
import { Label } from '@fluentui/react/lib/Label';
import {
  ColumnActionsMode,
  IColumn,
  SelectionMode,
  buildColumns,
} from '@fluentui/react/lib/DetailsList';
import { CommandBar, ICommandBarItemProps } from '@fluentui/react/lib/CommandBar';
import { columnsToString } from './lib/utils';

import { IButtonProps } from '@fluentui/react/lib/Button';
import { ShimmeredDetailsList } from '@fluentui/react/lib/ShimmeredDetailsList';
import { Panel } from '@fluentui/react/lib/Panel';

initializeIcons();

const stackItemStyles: IStackItemStyles = {
  root: {
    color: DefaultPalette.white,
    display: 'flex',
  },
};

const innerStackTokens: IStackTokens = {
  childrenGap: 20,
};

const TextFieldDisabled: React.FunctionComponent<{ label: string, value: string | undefined, placeholder: string }> = ({ label, value, placeholder }) => {
  return (
    <TextField label={label} value={value} disabled placeholder={placeholder} />
  );
};

interface DataCenter {
  data_center: string;
  city?: string;
  state?: string;
  country?: string;
  cidr_blocks?: string[];
  conflict?: boolean;
  cidr_networks?: string[]
}

interface CidrNetwork {
  cidr_notation: string;
  subnet_bits: string;
  subnet_mask: string;
  wildcard_mask: string;
  network_address: string;
  broadcast_address: string;
  assignable_hosts: string;
  first_assignable_host: string;
  last_assignable_host: string;
}

const textFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: 200 } };
const calculatorIcon: IIconProps = { iconName: 'calculator' };

const linkStyle: Partial<ILinkStyles> = { root: { marginLeft: '.5rem' } };

const boldStyle: Partial<ITextStyles> = { root: { fontWeight: FontWeights.semibold } };
const stackTokens: IStackTokens = { childrenGap: 15 };
const stackStyles: Partial<IStackStyles> = {
  root: {
    width: '960px',
    margin: '0 auto',
    color: '#605e5c',
  },
};

let _items = [
  { data_center: "ams01", city: "Amsterdam", state: "", country: "NLD", cidr_blocks: ["10.2.200.0/23"], conflict: false },
  { data_center: "ams02", city: "Amsterdam", state: "", country: "NLD", cidr_blocks: ["10.3.220.0/24"], conflict: false }
];

function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
  const key = columnKey as keyof T;
  return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}

const overflowButtonProps: IButtonProps = { ariaLabel: 'More commands' };

export const App: React.FunctionComponent = () => {
  const [cidrValue, setcidrValue] = React.useState('');
  const [filterValue, setFilterValue] = React.useState<string | undefined>('');
  const [items, setItemsValue] = React.useState<(DataCenter)[] | undefined>(_items);
  const [requestedCidrNetwork, setRequestedCidrNetwork] = React.useState<(CidrNetwork | null)>();
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [elementDisabled, setElementDisabled] = React.useState(false);

  const openPanel = React.useCallback((cidrDetails: any) => {
    if (cidrDetails) {
      setIsPanelOpen(true);
      setPanelContent(cidrDetails);
    }
  }, []);

  const onDismiss = React.useCallback((ev?: React.SyntheticEvent | KeyboardEvent) => {
    if (ev) {
      setIsPanelOpen(false);
    }
  }, []);

  const [_allItems, setAllItemsValue] = React.useState<DataCenter[]>(_items);
  const [isSortedDescending] = React.useState(true);
  const [cidrMessage, setCidrMessage] = React.useState(false);

  function _buildColumns(
    items: (DataCenter | null)[] | undefined,
    canResizeColumns?: boolean,
    onColumnClick?: (ev: React.MouseEvent<HTMLElement>, column: IColumn) => any,
    sortedColumnKey?: string,
    isSortedDescending?: boolean,
    groupedColumnKey?: string,
  ) {
    const columns = buildColumns(
      items || [],
      canResizeColumns,
      onColumnClick,
      sortedColumnKey,
      isSortedDescending,
      groupedColumnKey,
    );

    columns.forEach(column => {
      column.ariaLabel = `Operations for ${column.name}`;
      column.columnActionsMode = ColumnActionsMode.disabled;

      if (column.key === 'data_center') {
        column.iconName = 'Cloud';
        column.isIconOnly = true;
      } else if (column.key === 'cidr_blocks') {
        column.name = "CIDR block(s)"
        column.columnActionsMode = ColumnActionsMode.disabled;
        column.isMultiline = true;
        column.minWidth = 200;
        column.onRender = (dc: DataCenter) => (
          dc.cidr_blocks && dc.cidr_blocks !== null &&
          dc.cidr_blocks.map((item) =>
            <p>
              <ActionButton allowDisabledFocus onClick={() => openPanel(dc.cidr_networks)}>
                {item}
              </ActionButton>
            </p>
          )
        );
      } else if (column.key === 'city') {
        column.name = "City";
      } else if (column.key === 'state') {
        column.name = "State"
      } else if (column.key === 'country') {
        column.name = "Country"
      } else if (column.key === 'conflict') {
        column.name = "Status"
        column.onRender = (item: DataCenter) => (
          item.conflict ?
            <Link rel="noopener" target="_blank" href="https://cloud.ibm.com/docs/solution-tutorials?topic=solution-tutorials-byoip" data-selection-invoke={true}>
              Conflict found 😮
            </Link>
            :
            <Link rel="noopener" target="_blank" href="https://cloud.ibm.com/docs" data-selection-invoke={true}>
              No conflict found 😎
            </Link>
        );
      }
    });

    return columns;
  }

  const onFilter = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      newValue ? setItemsValue(_allItems.filter(i => i.data_center.toLowerCase().indexOf(newValue) > -1)) : setItemsValue(_allItems);
      // TODO: Set a value for the filter
      setFilterValue(newValue)
    },
    [_allItems],
  );

  const onChangeCidrValue = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      if (cidrMessage !== false) {
        setCidrMessage(false);
      }
      setcidrValue(newValue || '');
    },
    [cidrMessage],
  );

  const [columns] = React.useState(_buildColumns(
    items,
    true,
    undefined,
    '',
    undefined,
    undefined,
  ));

  React.useEffect(() => {
    setElementDisabled(true);
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
        setElementDisabled(false);
      });
  }, [isSortedDescending]);

  const _calculateClicked = () => {
    if (cidrValue.match(cidrFormat)) {
      setItemsValue(undefined);
      setCidrMessage(false);
      setElementDisabled(true);

      // TODO: Pass the current filter and use it server side to only process the data centers / regions that are filtered.
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
          setRequestedCidrNetwork(response.data.requested_cidr_networks);
          setElementDisabled(false);
        })
    } else {
      setCidrMessage(true);
      setItemsValue(_allItems);
    }
  }

  const _onDownloadJSON = () => {
    const json = JSON.stringify(items);
    const url = window.URL.createObjectURL(new Blob([json]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ibmcloud.json');
    document.body.appendChild(link);
    link.click();
  }

  const _barItems: ICommandBarItemProps[] = [
    {
      key: 'downloadJSON',
      text: 'Download .json',
      split: true,
      iconProps: { iconName: 'Download' },
      disabled: elementDisabled,
      onClick: _onDownloadJSON
    },
  ];

  const _farItems: ICommandBarItemProps[] = [
    {
      key: 'info',
      text: 'Info',
      ariaLabel: 'Info',
      iconOnly: true,
      iconProps: { iconName: 'Info' },
      onClick: () => console.log('Info'),
    },
  ];

  let cidrFormat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[12][0-9]|3[0-2])$/;

  return (
    <React.Fragment>
      <Stack horizontalAlign="start" verticalAlign="center" styles={stackStyles} tokens={stackTokens}>
        <Text variant="xxLarge" styles={boldStyle}>
          CIDR Calculator for IBM Cloud (Unofficial)
        </Text>
        <Text>Use this tool to help to identify potential conflicts with IP addresses ranges in your on-premises environment(s) and IP address ranges used in IBM Cloud.</Text>
        <Separator></Separator>

        <Stack horizontal horizontalAlign="start" styles={stackStyles} tokens={stackTokens}>
          <Label required>Enter your IPv4 CIDR block:</Label>
          <TextField
            ariaLabel="Your IPv4 CIDR block"
            value={cidrValue}
            onChange={onChangeCidrValue}
            styles={textFieldStyles}
            errorMessage={
              cidrMessage ?
                <React.Fragment>
                  Invalid CIDR block!
                  <Link target="_blank" href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" data-selection-invoke={true} styles={linkStyle}>
                    Learn more
                  </Link>
                </React.Fragment>
                : ''}
          />
          <PrimaryButton iconProps={calculatorIcon} text="Calculate" onClick={_calculateClicked} allowDisabledFocus disabled={elementDisabled} />
        </Stack>

        <Stack horizontal tokens={innerStackTokens}>
          <Stack.Item grow styles={stackItemStyles}>
            <TextFieldDisabled label="Subnet Mask" value={requestedCidrNetwork?.subnet_mask} placeholder="0.0.0.0" />
          </Stack.Item>
          <Stack.Item grow styles={stackItemStyles}>
            <TextFieldDisabled label="Network Address" value={requestedCidrNetwork?.network_address} placeholder="0.0.0.0" />
          </Stack.Item>
          <Stack.Item grow styles={stackItemStyles}>
            <TextFieldDisabled label="First Assignable Host" value={requestedCidrNetwork?.first_assignable_host} placeholder="0.0.0.1" />
          </Stack.Item>
          <Stack.Item grow styles={stackItemStyles}>
            <TextFieldDisabled label="Last Assignable Host" value={requestedCidrNetwork?.last_assignable_host} placeholder="255.255.255.254" />
          </Stack.Item>
          <Stack.Item grow styles={stackItemStyles}>
            <TextFieldDisabled label="# Assignable Hosts" value={requestedCidrNetwork?.assignable_hosts} placeholder="4294967294" />
          </Stack.Item>
        </Stack>

        <Separator></Separator>
        <Stack horizontal horizontalAlign="start" styles={stackStyles} tokens={stackTokens}>

          <Label required>Filter by data center:</Label>
          <TextField
            ariaLabel="Filter by data center"
            onChange={onFilter}
            styles={textFieldStyles}
            disabled={elementDisabled}
          />
          <CommandBar
            items={_barItems}
            overflowButtonProps={overflowButtonProps}
            // farItems={_farItems}
            farItemsGroupAriaLabel="More actions"
          />
        </Stack>

        <ShimmeredDetailsList
          setKey="items"
          items={items || []}
          columns={columns}
          selectionMode={SelectionMode.none}
          enableShimmer={!items}
          ariaLabelForShimmer="Content is being fetched"
          ariaLabelForGrid="Item details"
        />

        <Panel
          isOpen={isPanelOpen}
          onDismiss={onDismiss}
          headerText="CIDR block(s)"
        >
          <Pivot aria-label="OnChange Pivot Example">
            {panelContent && panelContent.map((cidrNetwork, index) => {
              return (
                <PivotItem headerText={cidrNetwork?.cidr_notation}>
                  <Stack verticalFill={true} tokens={innerStackTokens}>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="CIDR Notation" value={cidrNetwork?.cidr_notation} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Subnet Mask" value={cidrNetwork?.subnet_mask} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Subnet Bits" value={cidrNetwork?.subnet_bits} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Wildcard Mask" value={cidrNetwork?.wildcard_mask} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Broadcast Address" value={cidrNetwork?.broadcast_address} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Network Address" value={cidrNetwork?.network_address} placeholder="0.0.0.0" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="First Assignable Host" value={cidrNetwork?.first_assignable_host} placeholder="0.0.0.1" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="Last Assignable Host" value={cidrNetwork?.last_assignable_host} placeholder="255.255.255.254" />
                    </Stack.Item>
                    <Stack.Item grow styles={stackItemStyles}>
                      <TextFieldDisabled label="# Assignable Hosts" value={cidrNetwork?.assignable_hosts} placeholder="4294967294" />
                    </Stack.Item>
                  </Stack>
                </PivotItem>
              )
            }
            )}
          </Pivot>
        </Panel>
      </Stack>
    </React.Fragment>
  );
};