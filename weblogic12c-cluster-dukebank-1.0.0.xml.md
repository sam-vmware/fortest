[wl]: https://raw.github.com/vmware-applicationdirector/solutions-import-beta/weblogic_cluster/wlinstaller.png 
[wl_so]: https://raw.github.com/vmware-applicationdirector/solutions-import-beta/weblogic_cluster/wl_so.png 

## Success
Your application has been successfully imported and ready to go but first there are a few final steps you need to follow before you can perform a deployment.

### Next Steps
1. In the WebLogic Service, you will need to ensure that you have configured the **weblogic_installer** content property to point to the location of your WebLogic 12 installer.
[![WebLogic Installer][wl]][wl]

2. You will need to configure the **mod_wl_so** content property in the Apache script as displayed to point to where you have it located. This can be obtained as an Oracle download from their site. http://www.oracle.com/technetwork/middleware/ias/downloads/wls-plugins-096117.html
[![Apache WebLogic Plugin][wl_so]][wl_so]

##### After this you good to go.
