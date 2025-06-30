import psycopg2

connect = psycopg2.connect(
    host="localhost",
    dbname="UDMS",
    port=5432,
    user="postgres", 
    password= "Admin_123"
    )

cursor = connect.cursor()

cursor.execute("SELECT * FROM program")

records = cursor.fetchall()

connect.commit()

if(connect): 
    print(records)
    print("database connected")


cursor.close()
connect.close()


