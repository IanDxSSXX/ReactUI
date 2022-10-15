import {ReactUIHelper} from "../utils/ReactUIHelper";
import {RUITag} from "../utils/ReactUIWrapper";
import {createElement, memo, useEffect} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {ReactUIElement} from "./ReactUIElement";
import lodash from "lodash"

// ---- react treat useXXX as a hook and Xxxx as a component,
//      can't use hook in a callback, so make react view it as a component
function UseEffectWrapper(func: Function, states?: any[]) {
    useEffect(() => {
        func()
    }, states)
}

const ReactElementWrapper = ({wrapper}:{wrapper:ReactUIElement}) => {
    // ---- error boundary
    const ErrorFallBack = ({error}: { error: Error }) => {
        let message
        if (wrapper.constructor.name === "ReactUIElement") {
            message = `in a RUI wrapper\n ${error.message}`
        } else {
            message = `in react ui component ${wrapper.constructor.name}\n ${error.message}`
        }
        ReactUIHelper.error(message)
        return RUITag("")
    }

    if (!wrapper.Body) ReactUIHelper.error("ReactUIElement must have a Body property, which returns the main")
    let context = {}
    for (let tag of [...new Set(wrapper.ruiContextTag)]) {
        context = {...context, ...wrapper.ruiContext[tag] ?? {}}
    }

    const component = wrapper.Body!(wrapper.props, context) as any
    if (!component) ReactUIHelper.error("ReactUIElement must have a proper return, current is null")
    wrapper.children = [component]

    let reactComponent = component.IAmReactUI ? wrapper.registerView(component).asReactElement() : component

    // ---- lifecycle
    // ---1 didMount and willUnmount
    useEffect(() => {
        !!wrapper.C.didMount && wrapper.C.didMount()
        return wrapper.C.willUnmount
    }, []);

    // ---2 components update state
    (wrapper.C.didUpdate??[]).forEach(({func, states}: any)=>{
        UseEffectWrapper(func, states)
    })

    return createElement(
        ErrorBoundary,
        {FallbackComponent: ErrorFallBack} as any,
        reactComponent
    )
}

export const ReactElementWrapperMemorized = memo(ReactElementWrapper, (pre, curr)=> {
    let preWrapper = pre.wrapper, currWrapper = curr.wrapper
    // ---- always re-render if not use memo
    let useMemo = currWrapper.C.useMemo??true
    if (!useMemo) return false

    // ---- styles and custom props
    // ---1 element props, update on change by default using deep equal
    if (!lodash.isEqual(preWrapper.elementProps, currWrapper.elementProps)) return false

    // ---2 themes, update on change by default using deep equal
    if (preWrapper.ruiThemeName !== currWrapper.ruiThemeName) return false
    if (!lodash.isEqual(preWrapper.ruiThemes, currWrapper.ruiThemes)) return false

    // ---3 contexts
    if (!lodash.isEqual(preWrapper.contexts, currWrapper.contexts)) return false

    // -4.5 custom and input props with shouldUpdate hook
    if (!!currWrapper.C.shouldUpdate) {
        return currWrapper.C.shouldUpdate(
            {...preWrapper.props, ...preWrapper.customProps}, {...currWrapper.props, ...currWrapper.customProps})
    }

    // ---4 custom props, update on change by default using deep equal
    //      no function hooks
    let filterKeyFunc = (_: any, key: string) => !["didMount", "didUpdate", "shouldUpdate", "willUnmount"].includes(key)
    if (!lodash.isEqual(lodash.pickBy(preWrapper.customProps, filterKeyFunc), lodash.pickBy(currWrapper.customProps, filterKeyFunc))) return false

    // ---5 input props
    if (!lodash.isEqual(preWrapper.props, currWrapper.props)) return false

    return true
}) as any


export function RUIProp(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalValue = descriptor.value;
    descriptor.value = function(...args: any[]) {
        if (args.length === 0) {
            // ---- check if there's default value, use toString and regex to match the first default value
            let functionString = originalValue.toString()
            let regex = /arguments.length > 0 && arguments\[0] !== undefined \? arguments\[0] : ([\s\S]*?);/g
            let match = functionString.match(regex)
            if (match?.length === 1) {
                let defaultValue = match[0].replace(regex, "$1");
                (this as ReactUIElement).setCustomProp(propertyKey, eval("("+defaultValue+")"))
            }
        } else if(args.length === 1) {
            (this as ReactUIElement).setCustomProp(propertyKey, args[0])
        }
        return originalValue.apply(this, args);
    }
}