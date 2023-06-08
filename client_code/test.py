import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from random import randint
# This is a module.
# You can define variables and functions here, and use them from any form. For example, in a top-level form:
#
#    from . import Module1
#
#    Module1.say_hello()
#

TESTING_MODE = True

def random_N_digits(n):
    range_start = 10**(n-1)
    range_end = (10**n)-1
    return randint(range_start, range_end)
  
prefix = "[)>+06:6J"
license = ''.join([str(random_N_digits(10)), str(random_N_digits(15))])
license2 = ''.join([str(random_N_digits(10)), str(random_N_digits(15))])
pn = str(random_N_digits(8))
pn2 = str(random_N_digits(8))
qr_orig = ''.join([prefix, license, ':P', pn, '-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#'])
qr_new = ''.join([prefix, license2, ':P', pn, '-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#'])

qr_s = (qr_orig, qr_new)

lic_plates = [
  "6J0001153522305290204228337:ZA",
  "6J0001153522305290204228337:ZB",
  "6J0001153522305290204228337:ZC",
  "6J0001153522305290204228337:ZD"
]

shipment = random_N_digits(8)
pallets = random_N_digits(2)
