using Attendance.DTOs;
using Attendance.DTOs.Employee;
using Attendance.Models;
using Attendance.Models.Machine;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Data
{
    public class DBContext(DbContextOptions<DBContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<Empshift>()
                .HasKey(e => new { e.EmpCode, e.ShiftCode, e.FromDate });

            modelBuilder.Entity<CreateEmployeeSpResult>().HasNoKey();
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
        public DbSet<CreateEmployeeSpResult> CreateEmployeeSpResult { get; set; } 

        }


}
