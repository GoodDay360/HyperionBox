package io.github.goodday360.hyperionbox

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings

object StorageBridge {
    // Check and request MANAGE_EXTERNAL_STORAGE
    fun ensureAllFilesAccess(activity: Activity): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                intent.data = Uri.parse("package:" + activity.packageName)
                activity.startActivity(intent)
                false
            } else {
                true
            }
        } else {
            true
        }
    }
}
