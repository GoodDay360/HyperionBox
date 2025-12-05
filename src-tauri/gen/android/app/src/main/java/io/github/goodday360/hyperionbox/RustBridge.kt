package io.github.goodday360.hyperionbox

object RustBridge {
    external fun onPermissionResult(granted: Boolean)

    init {
        System.loadLibrary("hyperionbox_lib") 
    }
}
