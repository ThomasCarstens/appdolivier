

(base) txa@zone1:~/keys/appdolivier$ eas build -p android --profile playstore --local

(base) txa@zone1:~/keys/appdolivier$ eas credentials

(base) txa@zone1:~/keys/appdolivier$ java -jar pepk.jar --keystore=keystore.jks --alias=8ecb6fb947a5c1b4fefcbe7ba585727b --output=output.zip --include-cert --rsa-aes-encryption --encryption-key-path=./encryption_public_key.pem

see master branch for FCMv1 key


------------
Demo VendorPro