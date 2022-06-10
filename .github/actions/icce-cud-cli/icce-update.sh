#!/bin/bash
# Copyright © 2022 Dimitri Prosper <dimitri_prosper@us.ibm.com>

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

set +o errexit
ibmcloud code-engine project select --name "$CE_PROJECT_NAME"
[ $? -ne 0 ] && echo "Error during project select" && exit 1
set -o errexit

# Reads and write configmaps to Code Engine from icce-project-config.json, skips if empty.
p_mount_configmap=""
if [ -f .github/workflows/icce-project-config.json ]; then
  if jq -e . .github/workflows/icce-project-config.json >/dev/null 2>&1; then
    configmaps=$(jq -c '.configmapsfromfile[]?' .github/workflows/icce-project-config.json)
    for configmap in $configmaps; do
      name=$(echo ${configmap} | jq -r '.name | select (.!=null)')
      file=$(echo ${configmap} | jq -r '.file | select (.!=null)')
      path=$(echo ${configmap} | jq -r '.path | select (.!=null)')

      set +o errexit
      ibmcloud code-engine configmap update --name "$name" --from-file "$file"
      [ $? -ne 0 ] && echo "Error during configmap update" && exit 1
      set -o errexit

     p_mount_configmap="--mount-configmap $path=$name"
    done
  else
    echo "Failed to create configmap from icce-project-config.json, either the file failed json parsing or something else went wrong." && exit 1
  fi
fi

set +o errexit
ibmcloud code-engine app update \
--name "$CE_APP_NAME" \
--image "$IMAGE"
[ $? -ne 0 ] && echo "Error during project update" && exit 1
set -o errexit

exit 0