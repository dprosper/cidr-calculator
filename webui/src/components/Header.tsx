import * as React from 'react';

import {
  Header,
  IconButton,
  Nav,
  Navbar,
  Whisper, Popover, RadioGroup, Radio
} from 'rsuite';


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
  elementDisabled: boolean,
  setLight: (value: any) => void
}

export const HeaderNav = ({
  isLight,
  issuesUrl,
  elementDisabled,
  setLight
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
              <Popover ref={ref} className={className} style={{ left, top, width: '190px' }} full>
                <RadioGroup
                  style={{
                    borderRadius: "0px",
                    marginLeft: "0px",
                    marginTop: "20px"
                  }}
                  name="radioList"
                  inline
                  appearance='picker'
                  value={isLight ? "light" : "dark"}
                  defaultValue="light"
                  onChange={() => {
                    setLight(!isLight)
                    onClose();
                  }}>
                  <span style={styles.radioGroupLabel}>Theme</span>
                  <Radio value="light" style={{ paddingLeft: "20px" }}><BsSunrise aria-label='change theme to light' style={{ marginLeft: "auto", marginRight: "auto", display: "block" }} /> Light</Radio>
                  <Radio value="dark" style={{ paddingLeft: "20px" }}><BsSunsetFill aria-label='change theme to dark' style={{ marginLeft: "auto", marginRight: "auto", display: "block" }} /> Dark</Radio>
                </RadioGroup>
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
