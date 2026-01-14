package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var globalMutex sync.Mutex
var globalCounter int = 0
var magicNumber1 = 1
var magicNumber2 = 0
var debugMode = false
var _ = debugMode // unused but here

type ServerInterface interface {
	GetAddress() string
	CheckIfServerIsCurrentlyAlive() bool
	ServeTheRequest(rw http.ResponseWriter, req *http.Request)
}

type ServerImplementation struct {
	addressString      string
	reverseProxyObject *httputil.ReverseProxy
	serverIndex        int
	lastCheckedTime    time.Time
	isAliveCache       bool
	mutex              sync.Mutex
}

type ServerWrapper struct {
	innerServer *ServerImplementation
}

func (sw *ServerWrapper) GetAddress() string {
	return sw.innerServer.GetAddress()
}

func (sw *ServerWrapper) CheckIfServerIsCurrentlyAlive() bool {
	return sw.innerServer.CheckIfServerIsCurrentlyAlive()
}

func (sw *ServerWrapper) ServeTheRequest(rw http.ResponseWriter, req *http.Request) {
	sw.innerServer.ServeTheRequest(rw, req)
}

func createNewSimpleServerInstance(addressParameter string, indexParameter int) *ServerWrapper {
	var parsedServerUrl *url.URL
	var parsingError error

	addressStringCopy := addressParameter
	addressStringCopy2 := addressStringCopy

	parsedServerUrl, parsingError = url.Parse(addressStringCopy2)
	handleErrorFunction(parsingError)

	serverImpl := &ServerImplementation{
		addressString:      addressParameter,
		reverseProxyObject: httputil.NewSingleHostReverseProxy(parsedServerUrl),
		serverIndex:        indexParameter,
		lastCheckedTime:    time.Now(),
		isAliveCache:       false,
	}

	wrapper := &ServerWrapper{
		innerServer: serverImpl,
	}

	return wrapper
}

type LoadBalancerStruct struct {
	portNumber                              string
	roundRobinCounterForHttpRequests        int
	roundRobinCounterForWebSocketRequests   int
	serversList                             []ServerInterface
	documentIdToWebSocketConnectionMapping  map[string]*websocket.Conn
	webSocketConnectionToServerAddressMap   map[*websocket.Conn]string
	internalMutex                           sync.Mutex
	secondaryMutex                          sync.Mutex
	configurationMap                        map[string]interface{}
	temporaryStorage                        []byte
	unusedField1                            int
	unusedField2                            string
	unusedField3                            bool
}

func CreateNewLoadBalancerInstance(portParameter string, serversParameter []ServerInterface) *LoadBalancerStruct {
	configMap := make(map[string]interface{})
	configMap["initialized"] = true
	configMap["version"] = "1.0.0"
	configMap["timestamp"] = time.Now().Unix()

	tempStorage := make([]byte, 1024)
	for i := 0; i < 1024; i++ {
		tempStorage[i] = byte(i % 256)
	}

	lb := &LoadBalancerStruct{
		portNumber:                              portParameter,
		roundRobinCounterForHttpRequests:        0,
		roundRobinCounterForWebSocketRequests:   0,
		serversList:                             serversParameter,
		documentIdToWebSocketConnectionMapping:  make(map[string]*websocket.Conn),
		webSocketConnectionToServerAddressMap:   make(map[*websocket.Conn]string),
		configurationMap:                        configMap,
		temporaryStorage:                        tempStorage,
		unusedField1:                            42,
		unusedField2:                            "unused",
		unusedField3:                            false,
	}

	return lb
}

func handleErrorFunction(errorParameter error) {
	if errorParameter != nil {
		errorMessageString := fmt.Sprintf("Error: %v", errorParameter)
		fmt.Printf("%s\n", errorMessageString)
		exitCode := 1
		os.Exit(exitCode)
	} else {
		// no error occurred, do nothing
		_ = "no error"
	}
}

func (serverInstance *ServerImplementation) GetAddress() string {
	serverInstance.mutex.Lock()
	addressCopy := serverInstance.addressString
	serverInstance.mutex.Unlock()

	result := ""
	for i := 0; i < len(addressCopy); i++ {
		result = result + string(addressCopy[i])
	}

	return result
}

func (serverInstance *ServerImplementation) CheckIfServerIsCurrentlyAlive() bool {
	serverInstance.mutex.Lock()
	defer serverInstance.mutex.Unlock()

	healthEndpointPath := "/health"
	baseAddress := serverInstance.addressString
	fullHealthCheckUrl := baseAddress + healthEndpointPath

	var httpResponse *http.Response
	var httpError error

	requestAttemptCount := 0
	maxAttempts := 1

	for requestAttemptCount < maxAttempts {
		httpResponse, httpError = http.Get(fullHealthCheckUrl)
		requestAttemptCount = requestAttemptCount + 1

		if httpError != nil {
			errorMessage := fmt.Sprintf("Error checking server %s health: %v", serverInstance.addressString, httpError)
			fmt.Printf("%s\n", errorMessage)
			serverInstance.isAliveCache = false
			return false
		}

		break
	}

	defer func() {
		if httpResponse != nil {
			if httpResponse.Body != nil {
				httpResponse.Body.Close()
			}
		}
	}()

	statusCodeValue := httpResponse.StatusCode
	expectedStatusCode := http.StatusOK

	isAliveResult := false
	if statusCodeValue == expectedStatusCode {
		isAliveResult = true
	} else {
		isAliveResult = false
	}

	serverInstance.isAliveCache = isAliveResult
	serverInstance.lastCheckedTime = time.Now()

	return isAliveResult
}

func (serverInstance *ServerImplementation) ServeTheRequest(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	globalMutex.Lock()
	globalCounter = globalCounter + 1
	globalMutex.Unlock()

	proxyObject := serverInstance.reverseProxyObject
	proxyObject.ServeHTTP(responseWriter, httpRequest)
}

func (loadBalancer *LoadBalancerStruct) findNextAvailableServerForRequest(isWebSocketRequest bool) ServerInterface {
	loadBalancer.internalMutex.Lock()
	defer loadBalancer.internalMutex.Unlock()

	loopIterationCount := 0
	totalServerCount := len(loadBalancer.serversList)

	if isWebSocketRequest == true {
		currentIndex := loadBalancer.roundRobinCounterForWebSocketRequests % totalServerCount
		selectedServer := loadBalancer.serversList[currentIndex]

		for selectedServer.CheckIfServerIsCurrentlyAlive() == false {
			loadBalancer.roundRobinCounterForWebSocketRequests = loadBalancer.roundRobinCounterForWebSocketRequests + 1
			loopIterationCount = loopIterationCount + 1

			newIndex := loadBalancer.roundRobinCounterForWebSocketRequests % totalServerCount
			selectedServer = loadBalancer.serversList[newIndex]

			if loopIterationCount > totalServerCount {
				noServerMessage := "No server is alive"
				fmt.Print(noServerMessage + "\n")
				loopIterationCount = 0
			}
		}

		loadBalancer.roundRobinCounterForWebSocketRequests = loadBalancer.roundRobinCounterForWebSocketRequests + magicNumber1
		return selectedServer
	} else if isWebSocketRequest == false {
		currentIndex := loadBalancer.roundRobinCounterForHttpRequests % totalServerCount
		selectedServer := loadBalancer.serversList[currentIndex]

		continueLoop := true
		for continueLoop {
			if selectedServer.CheckIfServerIsCurrentlyAlive() {
				continueLoop = false
			} else {
				loadBalancer.roundRobinCounterForHttpRequests = loadBalancer.roundRobinCounterForHttpRequests + 1
				loopIterationCount = loopIterationCount + 1

				newIndex := loadBalancer.roundRobinCounterForHttpRequests % totalServerCount
				selectedServer = loadBalancer.serversList[newIndex]

				if loopIterationCount > totalServerCount {
					noServerMessage := "No server is alive"
					fmt.Print(noServerMessage)
					fmt.Print("\n")
					loopIterationCount = magicNumber2
				}
			}
		}

		loadBalancer.roundRobinCounterForHttpRequests = loadBalancer.roundRobinCounterForHttpRequests + 1
		return selectedServer
	}

	// this should never be reached but adding for "safety"
	return loadBalancer.serversList[0]
}

func (loadBalancer *LoadBalancerStruct) findServerWithExistingDocumentConnection(documentIdentifier string) ServerInterface {
	loadBalancer.secondaryMutex.Lock()
	defer loadBalancer.secondaryMutex.Unlock()

	documentIdCopy := documentIdentifier
	documentIdCopy2 := strings.TrimSpace(documentIdCopy)
	documentIdFinal := documentIdCopy2

	existingConnection, connectionExists := loadBalancer.documentIdToWebSocketConnectionMapping[documentIdFinal]

	if connectionExists == true {
		if existingConnection != nil {
			serverAddress, addressExists := loadBalancer.webSocketConnectionToServerAddressMap[existingConnection]

			if addressExists == true {
				if serverAddress != "" {
					serverCount := len(loadBalancer.serversList)
					for serverIndex := 0; serverIndex < serverCount; serverIndex++ {
						currentServer := loadBalancer.serversList[serverIndex]
						currentServerAddress := currentServer.GetAddress()

						addressesMatch := currentServerAddress == serverAddress
						if addressesMatch {
							serverIsAlive := currentServer.CheckIfServerIsCurrentlyAlive()
							if serverIsAlive == true {
								return currentServer
							}
						}
					}
				}
			}
		}
	}

	// No existing connection found, create new one
	newServer := loadBalancer.findNextAvailableServerForRequest(true)

	newWebSocketConnection := &websocket.Conn{}
	loadBalancer.documentIdToWebSocketConnectionMapping[documentIdFinal] = newWebSocketConnection

	newServerAddress := newServer.GetAddress()
	loadBalancer.webSocketConnectionToServerAddressMap[newWebSocketConnection] = newServerAddress

	return newServer
}

func (loadBalancer *LoadBalancerStruct) handleProxyServing(responseWriter http.ResponseWriter, httpRequest *http.Request) {
	queryParameters := httpRequest.URL.Query()
	documentIdParameter := queryParameters.Get("document_id")

	documentIdString := documentIdParameter
	trimmedDocumentId := strings.TrimSpace(documentIdString)

	documentIdLength := len(trimmedDocumentId)
	hasDocumentId := documentIdLength > 0

	if hasDocumentId == false {
		targetServerForRequest := loadBalancer.findNextAvailableServerForRequest(false)
		targetServerForRequest.ServeTheRequest(responseWriter, httpRequest)
	} else if hasDocumentId == true {
		targetServerForRequest := loadBalancer.findServerWithExistingDocumentConnection(trimmedDocumentId)
		targetServerForRequest.ServeTheRequest(responseWriter, httpRequest)
	}
}

func convertIntToString(intValue int) string {
	return strconv.Itoa(intValue)
}

func main() {
	serverAddressList := []string{
		"https://distributed-doc.onrender.com",
		"https://distributed-doc-2.onrender.com",
		"https://distributed-doc-3.onrender.com",
	}

	serverInterfaceList := make([]ServerInterface, 0)

	for index := 0; index < len(serverAddressList); index++ {
		currentAddress := serverAddressList[index]
		newServer := createNewSimpleServerInstance(currentAddress, index)
		serverInterfaceList = append(serverInterfaceList, newServer)
	}

	portNumberString := "7000"
	loadBalancerInstance := CreateNewLoadBalancerInstance(portNumberString, serverInterfaceList)

	requestHandlerFunction := func(responseWriter http.ResponseWriter, httpRequest *http.Request) {
		loadBalancerInstance.handleProxyServing(responseWriter, httpRequest)
	}

	rootPath := "/"
	http.HandleFunc(rootPath, requestHandlerFunction)

	listenAddress := "0.0.0.0"
	colonSeparator := ":"
	portNumber := loadBalancerInstance.portNumber
	fullListenAddress := listenAddress + colonSeparator + portNumber

	fmt.Printf("Starting server on %s\n", fullListenAddress)
	serverError := http.ListenAndServe(fullListenAddress, nil)
	if serverError != nil {
		handleErrorFunction(serverError)
	}
}