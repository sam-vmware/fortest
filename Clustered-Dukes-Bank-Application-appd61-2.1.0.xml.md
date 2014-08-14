#Success
Blueprint has been successfully imported in to vCloud Automation Center – Application Services

There are  few final steps you need to follow before performing this deployment.

###Prerequisites:

Download the following files and keep it in local web server folder. 

	1. ZeusTM_93_Linux-x86_64
	2. Jboss-5.1-0.GA.zip
	
###Deployment steps:
1.Now click on deploy to deploy the application.

2.Enter name for deployment profile.

Step1: Deployment Environment tab will be displayed. Enter proper values as per your environment and click next.

Step2: Application Properties -> Service tab -> Stingray_traffic_Manager:

	        a.  No changes in value


![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Service-Property-Stingray.png)


		ii. Application Properties -> Service tab -> MySQL
	
	        a. db_root_password : Enter the database root password


![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Service-Property-MySql.png)
	
		iii.  Application Properties -> Service tab -> JbossAppServer 

			a. JBOSS_JMX_PWD   : Enter the jboss JMX password


![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Service-Property-JBossAppServer.png)

      
      
Step3: Application Properties -> Application Component tab

       i. Application Properties -> Application tab -> initialize_db_script 

	    a. db_password : Enter database password 
    
    
![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Application-Property-initialize-db-script.png)

	ii. Application Properties -> Application tab ->Dukes_Bank_App
		
		 No changes in value

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Application-Property-Dukes-Bank-App.png)

	
###Blueprint Canvas diagram for your reference: 

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/Blueprint-Canvas.png)

###Ready to go for deployment

###Smoke test after deployment:

Verify deployment by accessing URL http://WebPortal_IP/bank/main.faces

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/DukesBankSmoke1.png)

![alt tag](https://raw.github.com/vmware-applicationdirector/solutions-import-beta/Clustered-Duke-Bank-Application-Blueprint-50/DukesBankSmoke2.png)





 








