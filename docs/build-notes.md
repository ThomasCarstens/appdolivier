

(base) txa@zone1:~/keys/appdolivier$ eas build -p android --profile playstore --local

(base) txa@zone1:~/keys/appdolivier$ eas credentials

(base) txa@zone1:~/keys/appdolivier$ java -jar pepk.jar --keystore=keystore.jks --alias=8ecb6fb947a5c1b4fefcbe7ba585727b --output=output.zip --include-cert --rsa-aes-encryption --encryption-key-path=./encryption_public_key.pem

see master branch for FCMv1 key

see master branch for some hours - 20sept : 1h30 security management / 40min email

21sept: 1h email


https://appstoreconnect.apple.com
https://developer.apple.com/
(base) txa@zone1: eas whoami / login mykeys

You don't have the required permissions to perform this operation.

This can sometimes happen if you are logged in as incorrect user.
Run eas whoami to check the username you are logged in as.
Run eas login to change the account.

Original error message: Entity not authorized: AppEntity[51e2e72b-ed5c-4f8d-bc3e-86e58c5e5370] (viewer = RegularUserViewerContext[c8f58066-ec9d-4cea-87b0-b900211a7128], action = READ, ruleIndex = -1)
Request ID: 9e61ffaa-0e01-4445-951e-814bedcd9346
    Error: GraphQL request failed.
