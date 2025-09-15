package types

import (
	"time"

	"guillotine-cli/internal/config"

	guillotine "github.com/evmts/guillotine/sdks/go"
)

type CallParameter struct {
	Name  string
	Value string
}

// CallParametersStrings holds string representations of call parameters for UI
type CallParametersStrings struct {
	CallType   string
	Caller     string
	Target     string
	Value      string
	InputData  string
	GasLimit   string
	Salt       string
}

// GetParams returns parameter list for UI display based on call type
func (cp *CallParametersStrings) GetParams() []CallParameter {
	// Define parameter visibility rules based on call type
	paramConfig := []struct {
		name      string
		value     string
		showWhen  func(string) bool
		nameFunc  func(string) string
	}{
		{
			name:     config.CallParamCallType,
			value:    cp.CallType,
			showWhen: func(t string) bool { return true },
		},
		{
			name:     config.CallParamCaller,
			value:    cp.Caller,
			showWhen: func(t string) bool { return true },
		},
		{
			name:     config.CallParamTarget,
			value:    cp.Target,
			showWhen: func(t string) bool { return t != config.CallTypeCreate && t != config.CallTypeCreate2 },
		},
		{
			name:     config.CallParamValue,
			value:    cp.Value,
			showWhen: func(t string) bool { return t != config.CallTypeStaticCall },
		},
		{
			name:     config.CallParamGasLimit,
			value:    cp.GasLimit,
			showWhen: func(t string) bool { return true },
		},
		{
			name:     config.CallParamInput,
			value:    cp.InputData,
			showWhen: func(t string) bool { return true },
			nameFunc: func(t string) string {
				if t == config.CallTypeCreate || t == config.CallTypeCreate2 {
					return config.CallParamInputDeploy
				}
				return config.CallParamInput
			},
		},
		{
			name:     config.CallParamSalt,
			value:    cp.Salt,
			showWhen: func(t string) bool { return t == config.CallTypeCreate2 },
		},
	}
	
	params := []CallParameter{}
	for _, cfg := range paramConfig {
		if cfg.showWhen(cp.CallType) {
			paramName := cfg.name
			if cfg.nameFunc != nil {
				paramName = cfg.nameFunc(cp.CallType)
			}
			params = append(params, CallParameter{Name: paramName, Value: cfg.value})
		}
	}
	
	return params
}

// SetParam updates a parameter value by name
func (cp *CallParametersStrings) SetParam(name, value string) {
	switch name {
	case config.CallParamCallType:
		cp.CallType = value
	case config.CallParamCaller:
		cp.Caller = value
	case config.CallParamTarget:
		cp.Target = value
	case config.CallParamValue:
		cp.Value = value
	case config.CallParamGasLimit:
		cp.GasLimit = value
	case config.CallParamInput, config.CallParamInputDeploy:
		cp.InputData = value
	case config.CallParamSalt:
		cp.Salt = value
	}
}

// NewCallParametersStrings creates new parameters with defaults
func NewCallParametersStrings() CallParametersStrings {
	defaults := config.GetCallDefaults()
	return CallParametersStrings{
		CallType:   CallTypeToString(defaults.CallType),
		Caller:     defaults.CallerAddr,
		Target:     defaults.TargetAddr,
		Value:      defaults.Value,
		InputData:  defaults.InputData,
		GasLimit:   config.DefaultGasLimit,
		Salt:       defaults.Salt,
	}
}

// GetCallTypeOptions returns all available call type options
func GetCallTypeOptions() []string {
	return []string{
		config.CallTypeCall,
		config.CallTypeCallcode,
		config.CallTypeStaticCall,
		config.CallTypeDelegateCall,
		config.CallTypeCreate,
		config.CallTypeCreate2,
	}
}

// CallTypeFromString converts a string to SDK CallType
func CallTypeFromString(s string) guillotine.CallType {
	switch s {
	case config.CallTypeCall:
		return guillotine.CallTypeCall
	case config.CallTypeCallcode:
		return guillotine.CallTypeCallcode
	case config.CallTypeStaticCall:
		return guillotine.CallTypeStaticcall
	case config.CallTypeDelegateCall:
		return guillotine.CallTypeDelegatecall
	case config.CallTypeCreate:
		return guillotine.CallTypeCreate
	case config.CallTypeCreate2:
		return guillotine.CallTypeCreate2
	default:
		return guillotine.CallTypeCall
	}
}

// CallTypeToString converts SDK CallType to string
func CallTypeToString(ct guillotine.CallType) string {
	switch ct {
	case guillotine.CallTypeCall:
		return config.CallTypeCall
	case guillotine.CallTypeCallcode:
		return config.CallTypeCallcode
	case guillotine.CallTypeStaticcall:
		return config.CallTypeStaticCall
	case guillotine.CallTypeDelegatecall:
		return config.CallTypeDelegateCall
	case guillotine.CallTypeCreate:
		return config.CallTypeCreate
	case guillotine.CallTypeCreate2:
		return config.CallTypeCreate2
	default:
		return config.CallTypeCall
	}
}

type CallHistoryEntry struct {
	ID         string
	Timestamp  time.Time
	Parameters CallParametersStrings
	Result     *guillotine.CallResult
}

type DeployedContract struct {
	Address   string
	Bytecode  []byte
	Timestamp time.Time
}