Requires:
 boto
 paramiko

make sure key file has correct permissions

for f in sets/*; do ./start-worker.py $f; done