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

ibmcloud code-engine project delete --name "$CE_PROJECT_NAME" --force --hard
[ $? -ne 0 ] && echo "Error during project delete" && exit 1
set -o errexit

exit 0