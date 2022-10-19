import {createElement, memo, useEffect, useRef} from "react";
import {FragmentView} from "../utils/RUIWrapper";
import {ThemesState} from "./ThemeState";
import Running from "../base/Running";
import isEqual from 'lodash.isequal';
import {RUIElement} from "../element/RUIElement";
import {uid} from "../utils/Utils";
import ContextProvider from "../context/ContextProvider";


export default (...children: any[]) => new ThemeProvider(...children)


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
    let element = wrapper.children[0]

    return wrapper.registerView(element).asReactElement()
}

const ThemeWrapperMemorized = memo(ThemeWrapper, (prev, curr) => {
    let preElement = prev.wrapper.children[0]
    let currElement = curr.wrapper.children[0]

    let themeEqual = isEqual(prev.wrapper.themes, curr.wrapper.themes)
        && prev.wrapper.themeName === curr.wrapper.themeName
    return themeEqual && (preElement.IAmRUIElement && preElement.equalTo(currElement))
})

class ThemeProvider extends RUIElement {
    themes: any = {}
    themeName: any = "_NONE_"

    currThemeState?: ThemesState
    IAMThemeProvider = true
    themeId = uid()

    useTheme = (themeState: ThemesState) => {
        console.log("yse", this.themeId)
        this.currThemeState = themeState
        this.themes = themeState.themes
        this.themeName = themeState.themeName
        return this
    }

    constructor(...children: any) {
        super("", ...children);
    }


    asReactElement() {
        // ---- wrap children
        console.log(this.currThemeState, "ss")
        if (!!this.currThemeState) {
            // ---- add to context by default
            let ContextView = ContextProvider(...this.children).context({themeState: this.currThemeState})
            ContextView.contextId = this.themeId
            this.children = [ContextView]
        } else {
            this.children = [FragmentView(...this.children)]
        }

        return createElement(
            ThemeWrapperMemorized,
            {wrapper:this, ...!!this.P.key?{key: this.P.key}:{} }
        )
    }
}
