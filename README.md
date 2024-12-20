
This version is scaled down and removes all dependencies of running with a backend service, i.e. it can run on Github pages. The old version is still availabe under the v1 branch. 

# calculator

![](./docs/assets/calculatorAppUI.png)

### Run on Code Engine

1. Target your desired region.
  ```sh
    ibmcloud target -r us-east -g default
  ```

2. Create the Code Engine project.
  ```sh
    ibmcloud code-engine project create --name calculator
  ```

3. Create the application from an existing container image, expose port 3000. 
  ```sh
    ibmcloud code-engine app create -n calculator \
    --image docker.io/dprosper/calculator \
    --port 3000
  ```

### Build and run locally 

#### Build image
```sh
  docker build -t dprosper/ic-cidr-calculator -f Dockerfile .
  docker buildx build --platform=linux/amd64 --load -t dprosper/ic-cidr-calculator -f Dockerfile .
  docker buildx build --platform=linux/amd64 -t local-build --load .
```

### Run local
```sh
  docker run --rm -p 3000:3000 dprosper/ic-cidr-calculator
```

### Build and run on Pull Request

Submit a pull request and the code will be deployed to Code Engine to facilitate the review.

### Deploy Github pages

```sh
  npm run deploy
```