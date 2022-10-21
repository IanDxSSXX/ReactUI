import {Fragment as ReactFragment, ReactElement} from "react";
import {RTElement} from "../view/RTElement";
import RTConfig from "../base/RTConfig";

export function TagView(element: any, dotPropNames?: string[]) {
    return (...children: any) => {
        let ruiElement = new RTElement(element, ...children).deleteProp("className")
        ruiElement.IAmTagView = true
        if (RTConfig.debug) {
            let err = new Error()
            let stack = err.stack!
            let stackList = stack.split("\n")
            ruiElement.__fileName = stackList[2].replace(/.*\((https?:\/\/\S+)\)/, "$1")
        }

        if (!!dotPropNames) {
            return ruiElement.withDotProp(...dotPropNames)
        }
        return ruiElement
    }
}


export function ElementView(reactElement: ReactElement) {
    let ReactElementWrapper = ({reactElement}: any) => {
        return reactElement
    }
    return TagView(ReactElementWrapper)().setProps({reactElement})
}

export class Fragment extends RTElement {
    IAMFragment = true
    constructor(...children: any[]) {
        super(ReactFragment, ...children);
    }
    beforeAsReactElement() {
        super.beforeAsReactElement();

        if (!!this.__elementProps && !!this.__elementProps.key) {
            this.__elementProps = {key: this.__elementProps.key}
        } else {
            this.__elementProps = undefined
        }
    }
}

export function FragmentView(...children: any[]) {
    return new Fragment(...children)
}
