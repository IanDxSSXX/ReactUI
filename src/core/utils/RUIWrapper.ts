import {Fragment as ReactFragment, ReactElement} from "react";
import {RUITheme} from "../theme/RUITheme";
import {RUIElement} from "../element/RUIElement";


export function TagView(element: any) {
    return (...children: any) => new RUIElement(element, ...children).deleteProp("className")
}


export function ElementView(reactElement: ReactElement) {
    let ReactElementWrapper = ({reactElement}: any) => {
        return reactElement
    }
    return TagView(ReactElementWrapper)().setProps({reactElement})
}

export class Fragment extends RUIElement {
    IAMFragment = true
    constructor(...children: any[]) {
        super(ReactFragment, ...children);
    }
    beforeAsReactElement() {
        super.beforeAsReactElement();

        if (!!this.elementProps && !!this.elementProps.key) {
            this.elementProps = {key: this.elementProps.key}
        } else {
            this.elementProps = undefined
        }
    }
}

export function FragmentView(...children: any[]) {
    return new Fragment(...children)
}
