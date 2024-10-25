"use client"

import React from "react"

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from '@/components/Table';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Switch } from '@/components/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import {
  RiBuildingLine,
  RiMapPin2Line,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
} from '@remixicon/react';

import { DataCenter, Geography, CidrNetwork } from '@/components/common';

interface IProps {
  geographies: Geography[],
  search: string,
  onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void
}

type StateType = [boolean, () => void, () => void, () => void] & {
  state: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const useToggleState = (initial = false) => {
  const [state, setState] = React.useState<boolean>(initial)

  const close = () => {
    setState(false)
  }

  const open = () => {
    setState(true)
  }

  const toggle = () => {
    setState((state) => !state)
  }

  const hookData = [state, open, close, toggle] as StateType
  hookData.state = state
  hookData.open = open
  hookData.close = close
  hookData.toggle = toggle
  return hookData
}

export default function DataCenterCards({
  geographies,
  search,
  onSearch
}: IProps) {

  const [editOpen, showEdit, closeEdit] = useToggleState()
  const [dataCenterToDisplay, setDataCenterToDisplay] = React.useState<DataCenter | null>(null)
  const [panelContent, setPanelContent] = React.useState<(CidrNetwork | null)[]>();
  const [isAdmin] = React.useState<boolean>(false);

  const displayDataCenter = (dataCenter: DataCenter) => {
    setDataCenterToDisplay(dataCenter)
    showEdit()
    setPanelContent(dataCenter.cidr_networks);
  }

  const services = Array.from(new Set(panelContent?.map(i => i?.service)));

  return (
    <>
      <Card className="p-0 bg-zinc-100">
        <div className="p-3">
          <div className="block md:flex md:items-center md:justify-between">
            <Input
              type="search"
              placeholder="Search data center by name..."
              className="h-9 w-full rounded-md md:max-w-xs"
              id="search"
              name="search"
              value={search}
              onChange={onSearch}
            />
            {isAdmin &&
              <div className="lg:flex lg:items-center lg:space-x-3">
                <div className="hidden items-center space-x-2 lg:flex">
                  <Label
                    htmlFor="show-active"
                    className="whitespace-nowrap text-gray-500 dark:text-gray-500"
                  >
                    Show active data centers
                  </Label>
                  <Switch
                    id="show-active"
                    name="show-active"
                  />
                </div>
                <span className="hidden h-8 w-px bg-gray-200 dark:bg-gray-800 lg:block" />
                <Button className="mt-2 h-9 w-full sm:block md:mt-0 md:w-fit">
                  Add/Edit Data Center
                </Button>
              </div>
            }
          </div>
          {/* <Divider /> */}
        </div>
        <Tabs defaultValue={geographies[0].name}>
          <TabsList className="px-6 py-8">
            {geographies.map((geography) => (
              <TabsTrigger
                key={geography.name}
                value={geography.name}
                className="group"
              >
                <span className="group-data-[state=active]:text-gray-900 group-data-[state=active]:dark:text-gray-50 text-gray-600">
                  {geography.name}
                </span>
                {!geography.conflict &&
                  <span className="ml-2 hidden rounded-md bg-white px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset ring-gray-200 group-data-[state=active]:text-gray-700 dark:bg-[#090E1A] dark:ring-gray-800 group-data-[state=active]:dark:text-gray-300 sm:inline-flex">
                    {geography.data.length}
                  </span>
                }
                {geography.conflict &&
                  <span>
                    <span className="ml-2 hidden rounded-md bg-white px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset ring-gray-200 group-data-[state=active]:text-gray-700 dark:bg-[#090E1A] dark:ring-gray-800 group-data-[state=active]:dark:text-gray-300 sm:inline-flex">
                      {geography.data.filter(location => location.conflict == false).length}
                    </span>
                    <span className="pl-2">
                      /
                    </span>
                    <span className="ml-2 hidden text-red-600 dark:text-red-500 rounded-md bg-white px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset ring-gray-200 group-data-[state=active]:text-red-600 dark:bg-[#090E1A] dark:ring-gray-800 group-data-[state=active]:dark:text-red-500 sm:inline-flex">
                      {geography.data.filter(location => location.conflict == true).length}
                    </span>
                  </span>
                }
              </TabsTrigger>
            ))}
          </TabsList>
          {geographies.map((geography) => (
            <TabsContent
              key={geography.name}
              value={geography.name}
              className="space-y-4 px-6 pb-6 pt-6"
            >
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              >
                {geography.data.map((datacenter) => (
                  <Card
                    key={datacenter.name}
                    className="rounded-md p-4 dark:border-gray-800"
                    asChild
                    onClick={() => displayDataCenter(datacenter)}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <RiBuildingLine
                          className="size-5 text-gray-400 dark:text-gray-600"
                          aria-hidden={true}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {datacenter.name}
                        </p>

                        {
                          geography.calculating == true ?
                            datacenter.conflict === true ? (
                              <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-500  dark:bg-red-400/10">
                                conflicts
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400">
                                no conflicts
                              </span>
                            )
                            :
                            null
                        }
                      </div>
                      <ul
                        role="list"
                        className="mt-3 text-sm text-gray-500 dark:text-gray-500"
                      >
                        <li className="flex items-center space-x-2 py-1">
                          <RiMapPin2Line
                            className="size-5 text-gray-400 dark:text-gray-600"
                            aria-hidden={true}
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {datacenter.city}
                            {datacenter.state != "" ? ", " + datacenter.state + ", " + datacenter.country : ", " + datacenter.country}
                          </p>
                        </li>
                      </ul>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

        </Tabs>
      </Card>
      <div className="flex justify-center">
        <Drawer
          open={editOpen}
          onOpenChange={(modalOpened) => {
            if (!modalOpened) {
              closeEdit()
            }
          }}
        >
          <DrawerContent className="sm:max-w-7xl">
            <DrawerHeader>
              <DrawerTitle className="text-sm text-gray-600 dark:text-gray-400 ">
                <RiBuildingLine
                  className="size-5 mr-2 inline-block"
                  aria-hidden={true}
                />
                {dataCenterToDisplay?.name}
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400 ">
                <RiMapPin2Line
                  aria-hidden={true}
                  className="size-5 mr-2 inline-block"
                />
                {dataCenterToDisplay?.city}
                {dataCenterToDisplay?.state != "" ? ", " + dataCenterToDisplay?.state + ", " + dataCenterToDisplay?.country : ", " + dataCenterToDisplay?.country}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              {panelContent && services.map((serviceName, index) => {
                const tableContent = panelContent?.filter(i => i?.service == serviceName);
                return (
                  <React.Fragment key={index}>
                    {serviceName}
                    <TableRoot
                      className="mt-8"
                    >
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell></TableHeaderCell>
                            <TableHeaderCell className="text-right">CIDR Notation</TableHeaderCell>
                            <TableHeaderCell className="text-right">Subnet Mask</TableHeaderCell>
                            <TableHeaderCell className="text-right">Wildcard Mask</TableHeaderCell>
                            <TableHeaderCell className="text-right">Broadcast Address</TableHeaderCell>
                            <TableHeaderCell className="text-right">Network Address</TableHeaderCell>
                            <TableHeaderCell className="text-right">First Host</TableHeaderCell>
                            <TableHeaderCell className="text-right">Last Host</TableHeaderCell>
                            <TableHeaderCell className="text-right"># Hosts</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableContent?.map((cidrNetwork, index) => (
                            <TableRow
                              key={index}
                              className="even:bg-gray-50 even:dark:bg-gray-900 font-mono"
                            >
                              <TableCell className="text-right text-xs">
                                {cidrNetwork?.conflict === true ?
                                  <RiCloseCircleFill
                                    className="-ml-0.5 size-4 shrink-0 text-red-600 dark:text-red-500"
                                    aria-hidden={true}
                                  /> :
                                  <RiCheckboxCircleFill
                                    className="-ml-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500"
                                    aria-hidden={true}
                                  />
                                }
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium text-gray-900 dark:text-gray-50">
                                {cidrNetwork?.cidr_notation}
                              </TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.subnet_mask}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.wildcard_mask}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.broadcast_address}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.network_address}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.first_assignable_host}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.last_assignable_host}</TableCell>
                              <TableCell className="text-right text-xs">{cidrNetwork?.assignable_hosts}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableRoot>
                    <Divider />
                  </React.Fragment >
                )
              })}
            </DrawerBody>
            <DrawerFooter className="mt-6">
              <DrawerClose asChild>
                <Button
                  className="mt-2 w-full sm:mt-0 sm:w-fit"
                  variant="secondary"
                >
                  Go back
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}