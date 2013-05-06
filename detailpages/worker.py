#!/usr/bin/python

import os
import time

data_file = 'urls.txt'

os.system('rm done')

with open(data_file) as f:
  content = f.readlines()
  for project_url in content:
    project_url = project_url.strip()   
    project_url = project_url.replace('?ref=live','') 
    backers_url = project_url + '/backers'
    base_filename = project_url.split('/')[-1]
    os.system('curl "' + project_url + '" > data/' + base_filename + '.html');
    os.system('curl "' + backers_url + '" > data/' + base_filename + '__backers.html');
    time.sleep(2)

os.system('touch done')