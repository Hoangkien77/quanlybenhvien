const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // Kết nối CSDL từ db.js
const { render } = require('ejs');

const app = express();
const PORT = 3000;

// Middleware để xử lý dữ liệu từ form HTML
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sử dụng thư mục public để phục vụ các file tĩnh (HTML, CSS, JS)
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Route để xử lý đăng ký người dùng
app.get('/home', (req, res) => {
    res.render('home');
})

app.get('/new_hospital', async(req, res) => {
    res.render('newhospital');
});

app.post('/newhospital', async (req, res) => {
    const { hospitalName, address, longitude, latitude, bedNumber, workingHours, status } = req.body;

    try {
        // Thực hiện truy vấn để lưu dữ liệu vào bảng users
        const query =  'INSERT INTO hospital (hospital_name, address, longitude, latitude, bed_number, working_hours, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [hospitalName, address, longitude, latitude, bedNumber, workingHours, status];

        const result = await pool.query(query, values)
        
        // Trả về phản hồi cho người dùng
        res.redirect('/showhospital');
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).send('co loi khi them benh vien');
    }
});
app.get('/signup' , (req, res) => {
    res.render('signup');
});

app.post('/signup_test', async (req, res) => {
    const { hospitalName, address, longitude, latitude, bedNumber, workingHours, status } = req.body;

    try {
        // Thực hiện truy vấn để lưu dữ liệu vào bảng users
        const query = 'INSERT INTO users (user_name, user_phone, user_password, user_email, user_location) VALUES ($1, $2, $3, $4, $5,) RETURNING *';
        const values = [user_name, user_phone, user_password, user_email, user_location];

        const result = await pool.query(query, values);
        
        // Trả về phản hồi cho người dùng
        res.send('them thanh cong');
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).send('co loi khi them benh vien');
    }
});

app.get('/showuser', async (req, res) => {
  const user = await pool.query('SELECT * FROM users');
  res.render('show_user', {user: user.rows});
});

app.get('/deleteuser/:id', async (req, res) => {
  const userId = req.params.id;// Lấy user_id từ URL

  const query = 'DELETE FROM users WHERE user_id = $1 RETURNING *';
  
  pool.query(query, [userId])
    .then(result => {
      if (result.rowCount > 0) {
        // Nếu xóa thành công điều hướng về lại danh sách người dùng
        res.redirect('/show_user')
      };
    });
});

app.get('/updateuser/:id', async (req, res) => {
    const userId = req.params.id;
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  res.render('update_user', {user: user.rows[0]})
})

app.get('/showhospital', async (req, res) => {
    const hospital_list = await pool.query(' SELECT * FROM hospital');
    res.render('show', { hospitals: hospital_list.rows }); 
});

app.get('/deletehospital/:id', (req, res) => {
    const hospitalId = req.params.id; // Lấy hospital_id từ URL
    
    const query = 'DELETE FROM hospital WHERE hospital_id = $1 RETURNING *';
  
    pool.query(query, [hospitalId])
      .then(result => {
        if (result.rowCount > 0) {
          // Nếu xóa thành công, điều hướng về danh sách bệnh viện
          res.redirect('/showhospital');
        } else {
          res.send(`Không tìm thấy bệnh viện với ID ${hospitalId}.`);
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Đã xảy ra lỗi khi xóa bệnh viện.');
      });
  });


app.get('/update_hospital/:id', async (req, res) => {
    const hospitalId = req.params.id;
    try {
      const hospital = await pool.query(`SELECT * FROM hospital WHERE hospital_id = ${hospitalId}`);
      res.render('update_hospital', { hospital: hospital.rows[0] }); // Lấy đối tượng bệnh viện đầu tiên trong mảng
      
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/hospital_update_final/:id', async (req, res) => {
  const hospitalId = req.params.id;
  const {hospitalName, address, longitude, latitude, bedNumber, workingHours, status} = req.body;
  const update = await pool.query( 'UPDATE hospital SET hospital_name = $1, address = $2, longitude = $3, latitude = $4, bed_number = $5, working_hours = $6, status = $7 WHERE hospital_id = $8',
  [hospitalName, address, longitude, latitude, bedNumber, workingHours, status, hospitalId]);
  res.redirect('/showhospital')
});

app.get('/hospital_list', async (req, res) => {
  const hospital_list = await pool.query(' SELECT * FROM hospital');
    res.render('show_list', { hospitals: hospital_list.rows });
});


app.get('/register', (req, res) => {
    res.render('register'); // Render file register.ejs
  });

app.get('/login', async (req, res) => {
  res.render('login', {message: '' } )

})
  
  // Route xử lý đăng ký
  app.post('/register', async (req, res) => {
    const { user_name, user_phone, user_password, user_email, user_location} = req.body;
  
    try {
      const email_check = await pool.query('SELECT user_email FROM users WHERE user_email = $1', [user_email])
      if (email_check.rows.length>0) {
         return res.status(400).json({ message: 'Email đã được sử dụng, vui lòng nhập email khác.' });
      };
      // Truy vấn để thêm người dùng vào cơ sở dữ liệu
      await pool.query(
        'INSERT INTO users(user_name, user_phone, user_password, user_email, user_location) VALUES ($1, $2, $3, $4, $5)',
        [user_name, user_phone, user_password, user_email, user_location]
      );
      res.send('User registered successfully!');
    } catch (err) {
      console.error('Error inserting data', err.stack);
      res.status(500).send('Error registering user');
    }
  });

  app.post('/user_login', async (req, res) => {
    const { user_email, user_password } = req.body;
  
    try {
      // Sử dụng parameterized queries để tránh SQL Injection
      const result = await pool.query('SELECT user_password FROM users WHERE user_email = $1', [user_email]);
      const user = await pool.query('SELECT * FROM users WHERE user_email = $1', [user_email]);
      if (result.rows.length === 0) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      const password = result.rows[0].user_password;
  
      // Kiểm tra mật khẩu
      if (password === user_password) {
        res.render('user', {user:user.rows[0]});
      } else {
        res.render('login', { message: 'sai mật khẩu'});
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send({ message: 'Server error' });
    }
  });

  app.post('/update_user_final/:id', async (req, res) => {
    const userId = req.params.id; // Lấy id người dùng từ URL
    const { user_name, user_phone, user_password } = req.body; // Lấy dữ liệu từ form gửi lên
    
    try {
        // Truy vấn cập nhật thông tin người dùng trong cơ sở dữ liệu
        const query = await pool.query(
            'UPDATE users SET user_name = $1, user_phone = $2, user_password = $3 WHERE user_id = $4',
            [user_name, user_phone, user_password, userId]
        );
        
        // Sau khi cập nhật thành công, chuyển hướng người dùng đến trang đăng nhập
        res.redirect('/login');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Có lỗi xảy ra khi cập nhật thông tin người dùng.');
    }
});

app.get('/logout', async (req, res) => {
  res.redirect('/login');
})

app.get('/khoa_list', async (req,res) =>{
  const khoa = await pool.query('SELECT * FROM khoa')
  res.render('list_khoa', {khoa: khoa.rows});
});


  app.get('/show_khoa/:id', async (req, res) => {
    const hospitalId = req.params.id;  // Lấy hospital_id từ URL

    try {
        // Truy vấn danh sách các khoa của bệnh viện với hospital_id
        const result = await pool.query(`
            SELECT 
                hospital.hospital_name,
                array_agg(khoa.name_khoa) AS khoa_names
            FROM 
                hospital
            JOIN 
                hospital_khoa ON hospital.hospital_id = hospital_khoa.hospital_id
            JOIN 
                khoa ON hospital_khoa.khoa_id = khoa.id_khoa
            WHERE 
                hospital.hospital_id = $1
            GROUP BY 
                hospital.hospital_name
        `, [hospitalId]);

        // Kiểm tra nếu có kết quả
        if (result.rows.length === 0) {
            return res.status(404).send('Không tìm thấy bệnh viện này.');
        }

        // Đảm bảo khoa_names là mảng hợp lệ và bệnh viện tồn tại
        const hospital = result.rows[0];
        const khoaNames = hospital.khoa_names || []; 

        // Render view với dữ liệu khoa của bệnh viện
        res.render('khoa', { 
            hospital_name: hospital.hospital_name, 
            khoa_names: khoaNames 
        });
    } catch (error) {
        console.error('Lỗi khi truy vấn cơ sở dữ liệu:', error);
        res.status(500).send('Lỗi server');
    }
});

app.get('/hospital_detail/:khoa_id', async (req, res) => {
  const khoaId = req.params.khoa_id;

  try {
    // Truy vấn các bệnh viện có khoa_id tương ứng
    const result = await pool.query(`
      SELECT 
        hospital.hospital_name,
        hospital.hospital_id AS hospital_id,
        array_agg(khoa.name_khoa) AS khoa_names
      FROM 
        hospital
      JOIN 
        hospital_khoa ON hospital.hospital_id = hospital_khoa.hospital_id
      JOIN 
        khoa ON hospital_khoa.khoa_id = khoa.id_khoa
      WHERE 
        khoa.id_khoa = $1
      GROUP BY 
        hospital.hospital_name, hospital.hospital_id
    `, [khoaId]);

    // Kiểm tra nếu có kết quả
    if (result.rows.length === 0) {
      return res.status(404).send('Không tìm thấy bệnh viện nào cho khoa này.');
    }

    // Render view với dữ liệu bệnh viện và các khoa
    res.render('hospital_detail', { hospitals: result.rows });
  } catch (error) {
    console.error('Lỗi khi truy vấn cơ sở dữ liệu:', error);
    res.status(500).send('Lỗi server');
  }
});



app.get('/map_hospital/:id', async (req, res) => {
    try {
      const hospitalId = req.params.id
        const hospitals = await pool.query('SELECT hospital_name,latitude, longitude FROM hospital WHERE hospital_id = $1', [hospitalId]);
        res.render('map', {hospitals: hospitals.rows});
    } catch (error) {
        console.error(error);
        res.status(500).send('Lỗi khi truy vấn dữ liệu từ cơ sở dữ liệu');
    }
});

app.get('/admin', async (req, res) => {
  res.render('admin')
})

// Lắng nghe các yêu cầu tại cổng đã đặt
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});