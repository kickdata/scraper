#!/usr/bin/python

import boto.ec2
import paramiko
import time
import socket
import sys
import ConfigParser

config = ConfigParser.RawConfigParser()
config.read('config.ini')

from boto.ec2.connection import EC2Connection

awsAccessKeyId=config.get('aws', 'access_key_id')
awsSecretAccessKey=config.get('aws', 'secret_key')
sshKeyFile=config.get('ssh', 'key_file')

ec2_conn = EC2Connection(awsAccessKeyId, awsSecretAccessKey)

instances = ec2_conn.get_all_instances(None,{'instance-state-code': 16})
for instance in instances:
  instance =  instance.instances[0]
  print "Checking " + instance.public_dns_name
  client = paramiko.SSHClient()
  client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
  client.connect(instance.public_dns_name, username='ubuntu', password='',key_filename=sshKeyFile)
  stdin, stdout, stderr = client.exec_command('ls done')
  linecount = 0
  for line in stdout:
    linecount = linecount + 1
    #print "  " + instance.public_dns_name + ': ' + line.strip('\n')  
  if linecount > 0:
    print "  Done! Getting results"
    sftp = client.open_sftp()
    stdin, stdout, stderr = client.exec_command('tar cfj data.tar.bz2 data')
    stdout.channel.recv_exit_status()
    sftp.get('data.tar.bz2','collected/' + instance.public_dns_name + ".tar.bz2") 
  client.close()