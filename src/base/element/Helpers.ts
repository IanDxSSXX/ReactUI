import {ReactUIHelper} from "../utils/ReactUIHelper";
import {RUITag} from "../utils/ReactUIWrapper";
import {createElement, memo, useEffect} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {ReactUIElement} from "./ReactUIElement";


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

    let preProps = preWrapper.props, currProps = currWrapper.props

    if (!!currWrapper.C.shouldUpdate) return currWrapper.C.shouldUpdate(preProps, currProps)

    // ---- shallow equal
    for (let key of Object.keys(preProps)) {
        if (preProps[key] !== currProps[key]) return false
    }

    return true
}) as any


export function RUIProp(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalValue = descriptor.value;
    descriptor.value = function(...args: any[]) {
        if (args.length === 1) {
            (this as ReactUIElement).setCustomProp(propertyKey, args[0], args[1]??true)
        }
        return originalValue.apply(this, args);
    }
}