#!/usr/bin/python

import boto.ec2
import paramiko
import time
import socket
import sys
import ConfigParser

from boto.ec2.connection import EC2Connection

config = ConfigParser.RawConfigParser()
config.read('config.ini')

awsAccessKeyId=config.get('aws', 'access_key_id')
awsSecretAccessKey=config.get('aws', 'secret_key')
awsKeyName=config.get('aws', 'key_name')
sshKeyFile=config.get('ssh', 'key_file')

ec2_conn = EC2Connection(awsAccessKeyId, awsSecretAccessKey)

def port_is_open(ip,port):
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  try:
    s.connect((ip, int(port)))
    s.shutdown(2)
    return True
  except:
    return False

def wait_for_port(ip,port):
  while (not port_is_open(ip,port)):
    time.sleep(1)  

def setup_worker(ip,in_file):
  print "  Setting up worker " + ip
  print "  SSH key " + sshKeyFile
  client = paramiko.SSHClient()
  client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
  client.connect(ip, username='ubuntu', password='',key_filename=sshKeyFile)
  sftp = client.open_sftp()
  print "  Transferring files..."
  sftp.mkdir('data')
  sftp.put(in_file,"urls.txt")
  sftp.put('worker.py','worker.py')
  print "  Starting worker"
  stdin, stdout, stderr = client.exec_command('chmod +x worker.py')
  stdout.channel.recv_exit_status()
  stdin, stdout, stderr = client.exec_command('./worker.py &')
  #for line in stdout:
  #  print "  " + ip + ': ' + line.strip('\n')
  client.close()

def launch_worker(ec2_conn,in_file):
  print "Launching new worker"
  instance = ec2_conn.run_instances(
    'ami-3fec7956',
     key_name=awsKeyName,
     instance_type='t1.micro',
     security_groups=['default'] 
  ).instances[0]
  print "  Provisoned instance " + instance.id + " and waiting for it to start..."
  while (instance.state != 'running'):
    instance.update()
    time.sleep(1)
  print "  Instance " + instance.id + " is now " + instance.state + " at " + instance.public_dns_name
  print "  Waiting for SSH to become available"
  wait_for_port(instance.public_dns_name,22)
  setup_worker(instance.public_dns_name,in_file)
  print "Setup finished"

launch_worker(ec2_conn,sys.argv[1])
