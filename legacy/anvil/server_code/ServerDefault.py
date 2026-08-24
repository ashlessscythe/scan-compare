import anvil.email
import anvil.users
import anvil.files
from anvil.files import data_files
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
from datetime import datetime
import anvil.server
import anvil
import io
import pandas as pd
from anvil.pdf import PDFRenderer

@anvil.server.callable
def create_pdf(**args):
    # print(f"from server, args is {args}")
    sid = args['sid']
    pallets = args['pallets']
    print(f"sid is {sid}, pallets is {pallets}")
    pdf = PDFRenderer(filename=f"shipment_{sid}_report.pdf"
                     ).render_form("ReportPDF", 
                                   args
                                  )
    return pdf

@anvil.server.callable
def send_pdf_email(**args):
  pdf = create_pdf(**args)
  user = get_user()
  anvil.email.send(
    from_address='no-reply',
    from_name="Tesla Scan", 
    to=[user],
    # to=[user, 'cc@example.com'],
    cc=['cc@example.com', 'cc@example.com'],
    subject=f"Tesla Scan Shipment {args['sid']} Complete",
    text=f"Attached verification for Tesla Scan: Shipment {args['sid']} for {args['pallets']} pallets.",
    attachments=pdf
  )
  return pdf

@anvil.server.callable
def close_shipment(sid):
  r = app_tables.shipments.get(shipment=sid)
  # update row
  r['status']= 'complete'
  print(f"shipment closed in db")

@anvil.server.callable
def add_shipment(sid, pallets):
  print(f"adding shipment {sid} with pallets {pallets} to db")
  app_tables.shipments.add_row(
    shipment=sid,
    total_pallets=pallets,
    scanned_pallets=0,   # default init
    status='in_progress', # default init
    timestamp=datetime.now()
  )

@anvil.server.callable
def get_shipment_row(sid):
  # returns liveObj
  return app_tables.shipments.get(shipment=sid)

@anvil.server.callable
def get_shipment_status(sid):
  r = app_tables.shipments.get(shipment=sid)
  if r == None:
    return 'none'
  else:
    return r['status']

@anvil.server.callable
def get_total_pallets(sid):
  return app_tables.shipments.get(shipment=sid)['total_pallets']

@anvil.server.callable
def get_scanned_pallets(sid):
  return app_tables.shipments.get(shipment=sid)['scanned_pallets']

@anvil.server.callable
def is_shipment_complete(sid):
  r = app_tables.shipments.get(shipment=sid)
  if r != None:
    print(f"shipment {sid} is {r} with len {len(r)}")
  if r == None:
    return False
  elif r['status'] == 'complete':
    return True
  else:
    return False
    
    
@anvil.server.callable
def shipment_exists(sid):
  print(f"checking if shipment {sid} exists")
  r = app_tables.scans.search(
    shipment=sid
  )
  return True if len(r) > 0 else False

@anvil.server.callable
def is_in_db(code):
  # col should be 0 or 1
  # print(f"checking if db has {code}")
  r = app_tables.scans.search(
    q.any_of(
      qr_orig=code,
      qr_new=code
    )
  )
  return True if len(r) > 0 else False

@anvil.server.callable
def send_email(sid):
  user = get_user()
  print(f"sending email to {user}")
  anvil.email.send(from_name="Tesla Scan",
                 to=[user],
                 cc=["cc@example.com"],
                 bcc=[],
                 subject=f"Shipment {sid} Completed",
                 text="File attached",
                 attachments=[export_to_excel(sid)])

@anvil.server.callable
def export_to_excel(sid):
    # data here instead of byRef
    data = app_tables.session_scan.search(user=get_user())   
    df = pd.DataFrame(data)
    content = io.BytesIO()
    df.to_excel(content, index=False)
    content.seek(0, 0)
    return anvil.BlobMedia(content=content.read(), content_type="application/vnd.ms-excel", name=f"shipment_{sid}")

@anvil.server.callable
def get_link():
  items = app_tables.session_scan.client_readable(user=get_user())
  return items.search().to_csv().url

@anvil.server.callable
def get_user():
  # returns email or no_login
  u = anvil.users.get_user()
  if u:
    user = anvil.users.get_user()['email']
  else:
    user = 'no_login'
  return user
  
@anvil.server.callable
def add_scan(**properties):
  # print(properties['scans'])
  #shipment stuffs
  sid = int(properties['shipment'])
  shipment_row = app_tables.shipments.get(shipment=sid)
  user_row = app_tables.users.get(email=get_user())
  # scans stuffs
  scan = [s for s in properties['scans']]
  scan_1 = scan[0]
  scan_2 = scan[1]
  scan_3 = scan[2]
  scan_4 = scan[3]
  app_tables.scans.add_row(
    shipment_=shipment_row,
    num_pallets=int(properties['count_pallets']),
    qr_orig=properties['qr_s'][0],
    qr_new=properties['qr_s'][1],
    pn_orig=properties['pn_s'][0],
    pn_new=properties['pn_s'][1],
    scan_1=scan_1,
    scan_2=scan_2,
    scan_3=scan_3,
    scan_4=scan_4,
    result=properties['result'],
    created=datetime.now(),
    user_ = user_row,
    user_scan=get_user()
  )

  # increment pallets
  shipment_row['scanned_pallets'] += 1

  print(f"added row to db shipment: ({properties['shipment']}) result ({properties['result']})")
  
@anvil.server.callable
def session_add_row(index, sid, qr_s, pn_s, result):
    # print(f"New label scanned {qr_s}")    
    shipment_row = app_tables.shipments.get(shipment=sid)
    app_tables.session_scan.add_row(
      index=index,
      result=result,
      shipment_=shipment_row,
      pn_orig=pn_s[0],
      pn_new=pn_s[1],
      qr_orig=qr_s[0],
      qr_new=qr_s[1],
      user=get_user(),
      timestamp=datetime.now()
    )
    print(f'added row to session_db index {index} ')
    return {'result': 'ok', 'value': index}

@anvil.server.callable
def get_shipment_rows(sid):
  user = get_user()
  # print(f"sid is {sid}")
  shipment_row = app_tables.shipments.get(shipment=sid)
  # print(f"shipment_row is {shipment_row}")
  rows = app_tables.scans.search(
    shipment_=shipment_row
  )
  if rows:
    return rows
  else:
    return None

@anvil.server.callable
def get_session(sid):
  user = get_user()
  # print(f"sid is {sid}")
  shipment_row = app_tables.shipments.get(shipment=sid)
  # print(f"shipment_row is {shipment_row}")
  rows = app_tables.session_scan.search(q.all_of(
    user=user,
    shipment_=shipment_row
  ))
  if rows:
    return rows
  else:
    return None
  
@anvil.server.callable
def reset_session_db():
  user = get_user()
  # app_tables.session_scan.delete_all_rows()
  rows = app_tables.session_scan.search(user=user)
  print(f"deleting {len(rows)} rows from session db for user {user}")
  [r.delete() for r in rows]

