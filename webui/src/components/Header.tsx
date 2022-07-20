import * as React from 'react';

import {
  Header,
  IconButton,
  Nav,
  Navbar,
  Whisper, Popover, Divider,
  ButtonGroup
} from 'rsuite';

import { MdTableRows, MdTableView } from 'react-icons/md';
import { FaRegFolder } from 'react-icons/fa';

import MenuIcon from '@rsuite/icons/Menu';

import { BsSunrise, BsSunsetFill } from 'react-icons/bs';
import {
  GiLongAntennaeBug as GiLongAntennaeBugIcon
} from 'react-icons/gi';

const styles = {
  radioGroupLabel: {
    padding: '8px 2px 8px 10px',
    display: 'inline-block',
    verticalAlign: 'middle'
  }
};

interface IProps {
  isLight: boolean,
  issuesUrl: string,
  setLight: (value: any) => void
  onToolbar: (value: any) => void
}

export const HeaderNav = ({
  isLight,
  issuesUrl,
  setLight,
  onToolbar
}: IProps) => {

  return (
    <Header>
      <Navbar appearance="inverse">
        <Navbar.Brand >
          CIDR Conflict Calculator for IBM Cloud - Classic Infrastructure (Unofficial)
        </Navbar.Brand>
        <Nav pullRight style={{ marginTop: "15px", marginRight: "10px" }}>
          <Whisper
            placement="bottomEnd"
            trigger="click"
            speaker={({ onClose, left, top, className }, ref) => (
              <Popover ref={ref} className={className} style={{ left, top, width: '250px' }} full>
                <Divider style={{ margin: "5px 0" }} />
                <span style={styles.radioGroupLabel}>Theme</span>
                <ButtonGroup style={{ paddingLeft: "20px" }}>
                  <IconButton icon={!isLight ? <BsSunrise /> : <BsSunsetFill />} onClick={() => {
                    setLight(!isLight)
                    onClose();
                  }} title={!isLight ? 'light' : 'dark'} />
                </ButtonGroup>

                <Divider style={{ margin: "5px 0" }} />
                <span style={styles.radioGroupLabel}>View</span>
                <ButtonGroup style={{ paddingLeft: "30px" }}>
                  <IconButton icon={<MdTableRows />} onClick={() => onToolbar('list')} title='list' />
                  <IconButton icon={<FaRegFolder />} onClick={() => onToolbar('tab')} title='tab' />
                  <IconButton icon={<MdTableView />} onClick={() => onToolbar('spreadsheet')} title='table' />
                </ButtonGroup>
                <Divider style={{ margin: "5px 0" }} />

                <Nav.Item
                  href={issuesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<GiLongAntennaeBugIcon aria-label='report a bug' />}
                >
                  Report a bug
                </Nav.Item>
              </Popover>
            )}
          >
            <IconButton size="sm" icon={<MenuIcon />} />
          </Whisper>
        </Nav>
      </Navbar>
    </Header>
  )
}
