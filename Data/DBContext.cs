using Attendance.Models;
using Attendance.Models.Machine;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Data
{
    public class DBContext(DbContextOptions<DBContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<Empshift>()
                .HasKey(e => new { e.EmpCode, e.ShiftCode, e.FromDate });

            
            modelBuilder.Entity<Vw_CheckInOutViewModel>()
                .HasNoKey() // since views often don't have a primary key
                .ToView("vw_CheckInOutViewModel");

            modelBuilder.Entity<Vw_EmpShiftWithAllowance>()
                .HasNoKey()
                .ToView("vw_EmpShiftWithAllowance");

            modelBuilder.Entity<Empshift>()
             .HasOne(e => e.ShiftTime)
             .WithMany(s => s.EmpShifts)
             .HasForeignKey(e => e.ShiftCode)
             .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<EmpHoliday>()
                .HasKey(eh => new { eh.EmpCode, eh.Day }); // Composite PK

            modelBuilder.Entity<EmpHoliday>()
                .HasOne(eh => eh.Employee)
                .WithMany(e => e.EmpHolidays)
                .HasForeignKey(eh => eh.EmpCode);

            //modelBuilder.Entity<Empshift>()
            //    .HasOne(e => e.EmpInfo) // An Empshift is related to one Empinfo (one-to-many relationship)
            //    .WithMany(emp => emp.EmpShifts) // An Empinfo can have many Empshifts
            //    .HasForeignKey(e => e.EmpCode); // EmpCode is the FK in Empshift

            //// ربط CheckInOut بـ USERINFO
            //modelBuilder.Entity<CheckInOut>()
            //    .HasOne(c => c.UserInfo)
            //    .WithMany(u => u.CheckInOuts)
            //    .HasForeignKey(c => c.USERID)
            //    .HasPrincipalKey(u => u.USERID);
            //// ربط USERINFO بـ EMPINFO
            ///
            //modelBuilder.Entity<userinfo>()
            //    .HasOne(u => u.EmpInfo)
            //    .WithOne(e => e.UserInfo)
            //    .HasForeignKey<userinfo>(u => u.BADGENUMBER)
            //    .HasPrincipalKey<Empinfo>(e => e.EmployeeCode);

            //modelBuilder.Entity<CheckInOut>()
            //    .HasOne(c => c.EmpInfo) // CheckInOut has one EmpInfo
            //    .WithMany()  // EmpInfo can have many CheckInOut records
            //    .HasForeignKey(c => c.USERID) // USERID is the FK
            //    .OnDelete(DeleteBehavior.Cascade); // Optional: set delete behavior (Cascade, SetNull, etc.)
            // Relationship between Empinfo and CheckInOut

            //modelBuilder.Entity<Empinfo>()
            //    .HasMany(e => e.CheckInOut)  // Empinfo has many CheckInOut records
            //    .WithOne(c => c.EmpInfo)  // CheckInOut references Empinfo
            //    .HasForeignKey(c => c.USERID);  // Foreign key in CheckInOut

            //modelBuilder.Entity<ShiftTime>()
            //.HasOne(e=>e.ShiftType)
            //.WithOne(x=>x.Id)

            //modelBuilder.Entity<Empinfo>()
            //    .HasOne(e => e.Department)
            //    .WithMany(d => d.Employees)
            //    .HasForeignKey(e => e.DepartmentId)
            //    .OnDelete(DeleteBehavior.Restrict); // Optional: set delete behavior (Restrict, Cascade, etc.)


        }


        //Tables in DB we gonna query them
        public DbSet<Empinfo> EmpInfo { get; set; }
        public DbSet<Department> Department { get; set; }
        public DbSet<Users> Users { get; set; }
        public DbSet<Machine> Machines { get; set; }
        public DbSet<Empshift> EmpShift  { get; set; }
        public DbSet<ShiftTime> ShiftTime { get; set; }
        public DbSet<userinfo> USERINFO { get; set; }
        public DbSet<Holidays> HOLIDAYS { get; set; }
        public DbSet<WorkTimesHoliday> WorkTimesHoliday { get; set; }
        public DbSet<EmpHoliday> EmpHoliday { get; set; }
        public DbSet<ShiftType> ShiftType { get; set; }
        public DbSet<MachineAlerts> MachineAlerts { get; set; }
        public DbSet<MachineLastSync> MachineLastSync { get; set; }
        public DbSet<UserAlertActions> UserAlertActions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        //View
        public DbSet<Vw_CheckInOutViewModel> vw_CheckInOutViewModel { get; set; }
        public DbSet<Vw_EmpShiftWithAllowance> vw_EmpShiftWithAllowance { get; set; }

        //Stored Procedure
        public DbSet<AbsenceViewModel> AbsenceViewModel { get; set; }
        public DbSet<EarlyLeaveSummary> EarlyLeaveSummary { get; set; }
        public DbSet<DelayReportDto> DelayReportViewModel { get; set; }


        }


}
