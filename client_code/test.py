import anvil.server
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
# This is a module.
# You can define variables and functions here, and use them from any form. For example, in a top-level form:
#
#    from . import Module1
#
#    Module1.say_hello()
#

TESTING_MODE = False

qr_orig = "[)>+06:6J0001153522305290204228337:P1588325-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#"
qr_new = "[)>+06:6J0001153522207230944366728:P1507971-05-D:Q120:K7700014848:5K:4K80:3QEA:1T:15D:12D:99Z88405910:S:X0+#"
qr_new_match = "[)>+06:6J0001153522305290204228337:P1588325-00-C:Q120:K7700012394:5K1:4K180:3QEA:1T:15D20240528:99Z04228337+#"

qr_s = (qr_orig, qr_new)

lic_plates = [
  "6J0001153522305290204228337:ZA",
  "6J0001153522305290204228337:ZB",
  "6J0001153522305290204228337:ZC",
  "6J0001153522305290204228337:ZD"
]