#Success
Blueprint has been successfully imported in your local vCloud Application Director. 

There are  few final steps you need to follow before performing this deployment.

###Prerequisites:

Download the "Joomla_1.5.25-Stable-Full_Package.tar.gz" and "phpMyAdmin-3.5.2-all-languages.tar.gz" file from the following link and keep it in your local webserver folder.

1. **Joomla_1.5.25-Stable-Full_Package.tar.gz** : 
    *http://joomlacode.org/gf/download/frsrelease/16026/69664/Joomla_1.5.25-Stable-Full_Package.tar.gz*


2. **phpMyAdmin-3.5.2-all-languages.tar.gz** :
    *http://citylan.dl.sourceforge.net/project/phpmyadmin/phpMyAdmin/3.5.2/phpMyAdmin-3.5.2-all-languages.tar.gz*


###Deployment steps:
1.Now click on deploy to deploy the application.

2.Enter name for deployment profile.

Step1: Deployment Environment tab will be displayed. Enter proper values as per your environment and click next.

Step2: Application Properties -> Service tab -> Lamp_Stack
	
		a. db_root_password : Enter the database root password

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-6/Joomla-Blueprint-v1.0.0/Service-Property-LampStack.png)

		b.  Application Properties -> Service tab -> Joomala

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-6/Joomla-Blueprint-v1.0.0/Service-Property-Joomla.png)
	
	
###Blueprint Canvas diagram for your reference: 

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-6/Joomla-Blueprint-v1.0.0/Joomla-Blueprint-50-Blueprint-Canvas.png)

###Ready to go for deployment

###Smoke test after deployment:

Verify deployment by accessing URL http://<IP of your deployed system>/phpmyadmin/index.php
	
![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-6/Joomla-Blueprint-v1.0.0/Smoke%20Test.JPG)


 










 








