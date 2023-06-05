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
# // global
idx = 0
qr_s = []
shipment = 'no_shipment'
pallets = 0
current_pallet = 0
pn = 'no_pn'

def reset_globals(self):
  self.idx = 0
  self.shipment = 'no_shipment'
  self.pallets = 0
  self.pn = 'no_pn'
  