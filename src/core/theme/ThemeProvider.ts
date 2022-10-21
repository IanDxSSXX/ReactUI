import {createElement, memo, useEffect, useRef} from "react";
import {FragmentView} from "../utils/RTWrapper";
import {ThemesState} from "./ThemeState";
import Running from "../base/Running";
import isEqual from 'lodash.isequal';
import {RTElement} from "../view/RTElement";
import {uid} from "../utils/Utils";
import ContextProvider from "../context/ContextProvider";




// ---* condition
function ThemeWrapper({wrapper}: any) {
    // ---- very important, see notes
    const themeId = useRef(null)
    if (themeId.current !== null) wrapper.themeId = themeId.current
    useEffect(() => {
        themeId.current = wrapper.themeId
        return () => {
            delete Running.ThemeStore[wrapper.themeId]
        }
    },[])

    Running.ThemeStore[wrapper.themeId] = {
        themes: wrapper.themes,
        themeName: wrapper.themeName
    }
    let element = wrapper._children[0]

    return wrapper.registerView(element).asReactElement()
}

const ThemeWrapperMemorized = memo(ThemeWrapper, (prev, curr) => {
    let preElement = prev.wrapper._children[0]
    let currElement = curr.wrapper._children[0]

    let themeEqual = isEqual(prev.wrapper.themes, curr.wrapper.themes)
        && prev.wrapper.themeName === curr.wrapper.themeName
    return themeEqual && (preElement.IAmRTElement && preElement.equalTo(currElement))
})

class ThemeProvider extends RTElement {
    themes: any = {}
    themeName: any = "_NONE_"

    currThemeState?: ThemesState
    IAMThemeProvider = true
    name = "ThemeProvider"
    themeId = uid()

    useTheme = (themeState: ThemesState) => {
        this.currThemeState = themeState
        this.themes = themeState.themes
        this.themeName = themeState.themeName
        return this
    }

    constructor(..._children: any) {
        super("", ..._children);
    }


    asReactElement() {
        // ---- wrap _children
        if (!!this.currThemeState) {
            // ---- add to context by default
            let ContextView = ContextProvider(...this._children).context({themeState: this.currThemeState})
            ContextView.contextId = this.themeId
            this._children = [ContextView]
        } else {
            this._children = [FragmentView(...this._children)]
        }

        return createElement(
            ThemeWrapperMemorized,
            {wrapper:this, ...!!this.P.key?{key: this.P.key}:{} }
        )
    }
}

export default (..._children: any[]) => new ThemeProvider(..._children)
