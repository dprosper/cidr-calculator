"use client"
import * as React from 'react';

import init from 'frontend-wasm';
import { Geography, DataCenter, _copyAndSort } from '@/components/common';
import DataCenterCards from './cards';
import { InputSection } from './InputSection';
import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { RiMenuLine } from '@remixicon/react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // const [dataCenters, setDataCenters] = React.useState<DataCenter[]>([].slice());

  const [data, setData] = React.useState<Geography[]>([].slice());
  const [filteredData, setFilteredData] = React.useState<Geography[]>(data);
  const [isSortedDescending] = React.useState(true);
  const [search, setSearch] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [lastUpdated, setLastUpdated] = React.useState("")

  const onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    const geos = data.map(geo => {
      const filteredDCs = geo.data.filter(dataItem => dataItem.name.includes(event.target.value));
      return { ...geo, data: filteredDCs };
    });

    setFilteredData(JSON.parse(JSON.stringify(geos)));
  }

  React.useEffect(() => {
    init().then(() => {
      console.log('WASM loaded')
    });

    const fetchData = async () => {
      const response = await fetch('https://raw.githubusercontent.com/dprosper/cidr-calculator/refs/heads/main/data/datacenters.json');
      
      const data = await response.json();
      let sortedDataCenters: DataCenter[] = _copyAndSort(data.data_centers, "name", !isSortedDescending);
      sortedDataCenters = sortedDataCenters?.filter(i => i.private_networks != null);

      setTitle(data.name);
      setLastUpdated(data.last_updated);

      const Americas = sortedDataCenters?.filter(i => i.geo_region == "Americas");
      const Europe = sortedDataCenters?.filter(i => i.geo_region == "Europe");
      const Asia = sortedDataCenters?.filter(i => i.geo_region == "Asia Pacific");

      const dcs: Geography[] = [{ name: "Americas", data: Americas }, { name: "EMEA", data: Europe }, { name: "APAC", data: Asia }]

      setData(JSON.parse(JSON.stringify(dcs)));
    }

    fetchData()
      .catch(console.error);;

  }, [isSortedDescending]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-l from-gray-500 via-gray-700 to-black shadow-sm w-full">
        <div className="flex items-center justify-between h-[3.125rem] px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="md:hidden text-white hover:text-gray-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <RiMenuLine className="size-6 shrink-0 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </Button>
            <div className="ml-4 md:ml-0">
              <h4 className="text-sm text-white pl-3">CIDR Conflict Calculator for IBM Cloud Classic Infrastructure (a community provided tool)</h4>
            </div>
          </div>
        </div>
      </header>

      {/* <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        w-64 bg-white dark:bg-gray-800 overflow-y-auto transition duration-300 ease-in-out transform md:translate-x-0`}
        > */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col pt-[3.125rem]">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <nav className="flex flex-1 flex-col py-4">
            <InputSection
              data={data}
              setData={setData}
            />
            <span className="mt-auto">
              <Divider />

              <p className="font-semibold mt-5">
                About this tool
              </p>
              <p className="text-xs">
                Use this tool to identify potential conflicts between IP ranges in your on-premises environment(s) and IP ranges used in the
                IBM Cloud <a href="https://cloud.ibm.com/gen1/infrastructure/devices" rel="noreferrer" className="hover:underline hover:underline-offset-4 text-blue-600">Classic Infrastructure</a>.
                If you are using Virtual Private Cloud, you do not need this tool and can simply go to
                the <a href="https://cloud.ibm.com/infrastructure" rel="noreferrer" className="hover:underline hover:underline-offset-4 text-blue-600">Infrastructure console</a>.
              </p>

              <Divider />

              <span className="text-sm">
                <p className="font-semibold">
                  {title}
                </p>
                <p className="text-xs">
                  <a
                    href="https://cloud.ibm.com/docs/cloud-infrastructure?topic=cloud-infrastructure-ibm-cloud-ip-ranges"
                    target="_blank"
                    rel="noreferrer"
                    className="mr-1 hover:underline hover:underline-offset-4 text-blue-600"
                  >
                    Source Data
                  </a>

                  (<a
                    target="_blank"
                    rel="noreferrer"
                    href="https://raw.githubusercontent.com/dprosper/cidr-calculator/refs/heads/main/data/datacenters.json"
                    className="mr-1 hover:underline hover:underline-offset-4 text-blue-600"
                  >
                    download in JSON
                  </a>
                  )
                </p>
                <p className="text-xs">
                  Last updated on {lastUpdated}
                </p>
                <Divider />

                <div className="mt-5">
                  <p className="font-semibold mb-2">
                    IBM Cloud topics and tutorials
                  </p>
                  <a
                    href="https://cloud.ibm.com/docs/solution-tutorials?topic=solution-tutorials-byoip"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs hover:underline hover:underline-offset-4 text-blue-600"
                  >
                    Bring Your Own IP Address
                  </a>
                  <p className="text-xs font-normal">
                    This tutorial presents a brief overview of BYOIP implementation patterns that can be used with IBM Cloud Classic infrastructure
                    and a decision tree for identifying the appropriate pattern.
                  </p>

                  <ul>
                    <li className='pt-4'>
                      <a
                        href="https://ibm.com/cloud/data-centers"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs hover:underline hover:underline-offset-4 text-blue-600"
                      >
                        IBM Cloud global data centers
                      </a>
                    </li>
                  </ul>


                  <Divider />

                </div>
              </span>
              <span
                className="text-xs gap-2 leading-6"
              >
                A project by
                <a
                  className="hover:underline hover:underline-offset-4 text-blue-600 pl-1"
                  href="https://maisonprosper.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dimitri Prosper.
                </a>
              </span>
              <br />
              <span
                className="text-xs gap-2 leading-6"
              >
                The source code is available on
                <a
                  className="hover:underline hover:underline-offset-4 text-blue-600 pl-1"
                  href="https://github.com/dprosper/cidr-calculator"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub.
                </a>
              </span>
            </span>
          </nav>
        </div>
      </div>
      {/* </div> */}

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <main className="pt-[3.125rem]">
          <div className="lg:pl-72">
            <div className="px-4 py-1 sm:px-6 lg:px-8 lg:py-1">
              <div className="flex flex-col min-h-screen p-8 pb-20 gap-16 sm:p-5 font-sans]">
                {data.length > 0 &&
                  <DataCenterCards geographies={filteredData.length > 0 ? filteredData : data} search={search} onSearch={onSearch} />
                }
              </div>
            </div>
          </div>
        </main>
      </div>

    </>
  );
}